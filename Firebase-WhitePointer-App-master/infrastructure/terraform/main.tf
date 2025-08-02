# Main Terraform configuration for WhitePointer Enterprise Infrastructure
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }

  backend "gcs" {
    bucket = "whitepointer-terraform-state"
    prefix = "terraform/state"
  }
}

# Provider configurations
provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# Local values
locals {
  environment = var.environment
  project     = var.project_id
  region      = var.region
  
  common_labels = {
    environment = var.environment
    project     = "whitepointer"
    managed_by  = "terraform"
  }
}

# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "compute.googleapis.com",
    "container.googleapis.com",
    "sqladmin.googleapis.com",
    "redis.googleapis.com",
    "pubsub.googleapis.com",
    "cloudkms.googleapis.com",
    "secretmanager.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "servicenetworking.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",
    "run.googleapis.com",
    "certificatemanager.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com"
  ])

  service                    = each.value
  disable_on_destroy        = false
  disable_dependent_services = false
}

# Create service accounts
resource "google_service_account" "cluster_service_account" {
  account_id   = "${var.environment}-gke-sa"
  display_name = "GKE Service Account for ${var.environment}"
  description  = "Service account for GKE cluster operations"
}

resource "google_service_account" "workload_identity" {
  for_each = toset([
    "case-management",
    "document-service",
    "fleet-service",
    "auth-service",
    "notification-service"
  ])

  account_id   = "${var.environment}-${each.key}-sa"
  display_name = "Service Account for ${each.key}"
  description  = "Workload Identity service account for ${each.key}"
}

# VPC Network
resource "google_compute_network" "vpc" {
  name                            = "${var.environment}-vpc"
  auto_create_subnetworks        = false
  routing_mode                   = "REGIONAL"
  delete_default_routes_on_create = true
}

# Subnets
resource "google_compute_subnetwork" "gke_subnet" {
  name                     = "${var.environment}-gke-subnet"
  network                  = google_compute_network.vpc.id
  ip_cidr_range           = var.gke_subnet_cidr
  region                  = var.region
  private_ip_google_access = true

  secondary_ip_range {
    range_name    = "pods"
    ip_cidr_range = var.gke_pods_cidr
  }

  secondary_ip_range {
    range_name    = "services"
    ip_cidr_range = var.gke_services_cidr
  }

  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_sampling       = 0.5
    metadata           = "INCLUDE_ALL_METADATA"
  }
}

# Cloud Router for NAT
resource "google_compute_router" "router" {
  name    = "${var.environment}-router"
  network = google_compute_network.vpc.id
  region  = var.region
}

# Cloud NAT
resource "google_compute_router_nat" "nat" {
  name                               = "${var.environment}-nat"
  router                             = google_compute_router.router.name
  region                             = var.region
  nat_ip_allocate_option            = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

# Firewall rules
resource "google_compute_firewall" "allow_internal" {
  name    = "${var.environment}-allow-internal"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "icmp"
  }

  source_ranges = [
    var.gke_subnet_cidr,
    var.gke_pods_cidr,
    var.gke_services_cidr
  ]
}

# GKE Cluster
module "gke" {
  source = "./modules/gke"

  project_id                = var.project_id
  environment              = var.environment
  region                   = var.region
  network                  = google_compute_network.vpc.name
  subnetwork               = google_compute_subnetwork.gke_subnet.name
  cluster_service_account  = google_service_account.cluster_service_account.email
  workload_identity_sa     = google_service_account.workload_identity
  enable_autopilot         = var.gke_autopilot
  enable_private_cluster   = true
  master_ipv4_cidr_block  = var.gke_master_cidr
  
  node_pools = var.node_pools
  
  labels = local.common_labels
}

# Cloud SQL (PostgreSQL)
module "cloudsql" {
  source = "./modules/cloudsql"

  project_id          = var.project_id
  environment         = var.environment
  region              = var.region
  network_id          = google_compute_network.vpc.id
  database_version    = "POSTGRES_15"
  tier                = var.cloudsql_tier
  availability_type   = var.cloudsql_availability_type
  backup_enabled      = true
  point_in_time_recovery = true
  
  databases = [
    "whitepointer_cases",
    "whitepointer_documents",
    "whitepointer_fleet",
    "whitepointer_auth"
  ]
  
  labels = local.common_labels
}

# Redis (Memorystore)
module "redis" {
  source = "./modules/redis"

  project_id      = var.project_id
  environment     = var.environment
  region          = var.region
  network_id      = google_compute_network.vpc.id
  memory_size_gb  = var.redis_memory_size
  redis_version   = "REDIS_7_0"
  tier            = var.redis_tier
  
  labels = local.common_labels
}

# Cloud Storage Buckets
module "storage" {
  source = "./modules/storage"

  project_id   = var.project_id
  environment  = var.environment
  location     = var.region
  
  buckets = {
    documents = {
      name               = "${var.project_id}-${var.environment}-documents"
      storage_class      = "STANDARD"
      lifecycle_age_days = 90
      versioning        = true
    }
    backups = {
      name               = "${var.project_id}-${var.environment}-backups"
      storage_class      = "NEARLINE"
      lifecycle_age_days = 365
      versioning        = true
    }
    logs = {
      name               = "${var.project_id}-${var.environment}-logs"
      storage_class      = "STANDARD"
      lifecycle_age_days = 30
      versioning        = false
    }
  }
  
  labels = local.common_labels
}

# Pub/Sub Topics
module "pubsub" {
  source = "./modules/pubsub"

  project_id   = var.project_id
  environment  = var.environment
  
  topics = [
    "case-events",
    "document-events",
    "fleet-events",
    "notification-events",
    "audit-events"
  ]
  
  enable_dead_letter = true
  
  labels = local.common_labels
}

# Secret Manager
module "secrets" {
  source = "./modules/secrets"

  project_id   = var.project_id
  environment  = var.environment
  
  secrets = {
    database_password = {
      description = "PostgreSQL master password"
      automatic_replication = true
    }
    jwt_secret = {
      description = "JWT signing secret"
      automatic_replication = true
    }
    encryption_key = {
      description = "Application encryption key"
      automatic_replication = true
    }
  }
  
  labels = local.common_labels
}

# Artifact Registry
resource "google_artifact_registry_repository" "docker" {
  location      = var.region
  repository_id = "${var.environment}-docker"
  description   = "Docker repository for ${var.environment}"
  format        = "DOCKER"
  
  cleanup_policies {
    id     = "keep-recent-versions"
    action = "KEEP"
    
    most_recent_versions {
      keep_count = 10
    }
  }
  
  cleanup_policies {
    id     = "delete-old-versions"
    action = "DELETE"
    
    condition {
      older_than = "2592000s" # 30 days
    }
  }
}

# Cloud Build Trigger
module "cloudbuild" {
  source = "./modules/cloudbuild"

  project_id     = var.project_id
  environment    = var.environment
  github_owner   = var.github_owner
  github_repo    = var.github_repo
  branch_pattern = var.environment == "production" ? "^main$" : "^develop$"
  
  artifact_registry = google_artifact_registry_repository.docker.id
  gke_cluster_name  = module.gke.cluster_name
  gke_cluster_zone  = module.gke.cluster_zone
  
  labels = local.common_labels
}

# Monitoring & Alerting
module "monitoring" {
  source = "./modules/monitoring"

  project_id   = var.project_id
  environment  = var.environment
  
  notification_channels = var.notification_channels
  
  alerts = {
    high_cpu = {
      display_name = "High CPU Usage"
      condition_threshold_value = 0.8
      duration = "300s"
    }
    high_memory = {
      display_name = "High Memory Usage"
      condition_threshold_value = 0.9
      duration = "300s"
    }
    database_connections = {
      display_name = "High Database Connections"
      condition_threshold_value = 80
      duration = "180s"
    }
  }
  
  labels = local.common_labels
}

# Outputs
output "vpc_network" {
  value = google_compute_network.vpc.name
}

output "gke_cluster_name" {
  value = module.gke.cluster_name
}

output "gke_cluster_endpoint" {
  value     = module.gke.cluster_endpoint
  sensitive = true
}

output "database_connection_name" {
  value = module.cloudsql.connection_name
}

output "redis_host" {
  value = module.redis.host
}

output "artifact_registry_url" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker.repository_id}"
}