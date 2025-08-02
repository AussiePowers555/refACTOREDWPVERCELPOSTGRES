# Project configuration variables
variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "us-central1"
}

variable "zones" {
  description = "The GCP zones for multi-zonal resources"
  type        = list(string)
  default     = ["us-central1-a", "us-central1-b", "us-central1-c"]
}

# Network configuration
variable "gke_subnet_cidr" {
  description = "CIDR range for GKE subnet"
  type        = string
  default     = "10.0.0.0/20"
}

variable "gke_pods_cidr" {
  description = "CIDR range for GKE pods"
  type        = string
  default     = "10.1.0.0/16"
}

variable "gke_services_cidr" {
  description = "CIDR range for GKE services"
  type        = string
  default     = "10.2.0.0/16"
}

variable "gke_master_cidr" {
  description = "CIDR range for GKE master"
  type        = string
  default     = "172.16.0.0/28"
}

# GKE configuration
variable "gke_autopilot" {
  description = "Enable GKE Autopilot mode"
  type        = bool
  default     = false
}

variable "node_pools" {
  description = "GKE node pool configurations"
  type = map(object({
    machine_type   = string
    min_count      = number
    max_count      = number
    disk_size_gb   = number
    disk_type      = string
    preemptible    = bool
    spot           = bool
    node_locations = list(string)
    labels         = map(string)
    taints = list(object({
      key    = string
      value  = string
      effect = string
    }))
  }))
  default = {
    default = {
      machine_type   = "n2-standard-4"
      min_count      = 2
      max_count      = 10
      disk_size_gb   = 100
      disk_type      = "pd-standard"
      preemptible    = false
      spot           = false
      node_locations = []
      labels         = {}
      taints         = []
    }
    spot = {
      machine_type   = "n2-standard-2"
      min_count      = 0
      max_count      = 20
      disk_size_gb   = 100
      disk_type      = "pd-standard"
      preemptible    = false
      spot           = true
      node_locations = []
      labels = {
        workload-type = "batch"
      }
      taints = [{
        key    = "spot"
        value  = "true"
        effect = "NO_SCHEDULE"
      }]
    }
  }
}

# Database configuration
variable "cloudsql_tier" {
  description = "Cloud SQL instance tier"
  type        = string
  default     = "db-n1-standard-2"
}

variable "cloudsql_availability_type" {
  description = "Cloud SQL availability type"
  type        = string
  default     = "REGIONAL"
  validation {
    condition     = contains(["ZONAL", "REGIONAL"], var.cloudsql_availability_type)
    error_message = "Availability type must be ZONAL or REGIONAL."
  }
}

variable "cloudsql_backup_start_time" {
  description = "Cloud SQL backup start time"
  type        = string
  default     = "03:00"
}

variable "cloudsql_maintenance_window_day" {
  description = "Cloud SQL maintenance window day"
  type        = number
  default     = 7
}

variable "cloudsql_maintenance_window_hour" {
  description = "Cloud SQL maintenance window hour"
  type        = number
  default     = 4
}

# Redis configuration
variable "redis_memory_size" {
  description = "Redis memory size in GB"
  type        = number
  default     = 4
}

variable "redis_tier" {
  description = "Redis tier"
  type        = string
  default     = "STANDARD_HA"
  validation {
    condition     = contains(["BASIC", "STANDARD_HA"], var.redis_tier)
    error_message = "Redis tier must be BASIC or STANDARD_HA."
  }
}

# GitHub configuration for CI/CD
variable "github_owner" {
  description = "GitHub repository owner"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
}

# Monitoring configuration
variable "notification_channels" {
  description = "Email addresses for monitoring notifications"
  type        = list(string)
  default     = []
}

# Cost optimization
variable "enable_preemptible_nodes" {
  description = "Enable preemptible nodes for cost savings"
  type        = bool
  default     = false
}

variable "enable_spot_nodes" {
  description = "Enable spot nodes for cost savings"
  type        = bool
  default     = true
}

# Security configuration
variable "enable_binary_authorization" {
  description = "Enable Binary Authorization for container images"
  type        = bool
  default     = true
}

variable "enable_shielded_nodes" {
  description = "Enable Shielded GKE nodes"
  type        = bool
  default     = true
}

variable "enable_network_policy" {
  description = "Enable Kubernetes Network Policy"
  type        = bool
  default     = true
}

variable "master_authorized_networks" {
  description = "List of authorized networks for GKE master access"
  type = list(object({
    cidr_block   = string
    display_name = string
  }))
  default = []
}

# Feature flags
variable "enable_istio" {
  description = "Enable Istio service mesh"
  type        = bool
  default     = true
}

variable "enable_gke_backup" {
  description = "Enable GKE backup"
  type        = bool
  default     = true
}

variable "enable_config_sync" {
  description = "Enable Config Sync for GitOps"
  type        = bool
  default     = true
}