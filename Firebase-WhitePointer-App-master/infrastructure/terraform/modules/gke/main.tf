# GKE Module - Enterprise-grade Kubernetes cluster configuration

locals {
  cluster_name = "${var.environment}-gke-cluster"
  
  # Workload Identity namespace
  workload_identity_namespace = "${var.project_id}.svc.id.goog"
}

# GKE Cluster
resource "google_container_cluster" "primary" {
  name     = local.cluster_name
  location = var.region
  
  # Autopilot or Standard mode
  enable_autopilot = var.enable_autopilot
  
  # Remove default node pool for Standard clusters
  remove_default_node_pool = var.enable_autopilot ? null : true
  initial_node_count       = var.enable_autopilot ? null : 1
  
  # Network configuration
  network    = var.network
  subnetwork = var.subnetwork
  
  # IP allocation policy for VPC-native cluster
  ip_allocation_policy {
    cluster_secondary_range_name  = "pods"
    services_secondary_range_name = "services"
  }
  
  # Private cluster configuration
  private_cluster_config {
    enable_private_nodes    = var.enable_private_cluster
    enable_private_endpoint = false
    master_ipv4_cidr_block = var.master_ipv4_cidr_block
    master_global_access_config {
      enabled = true
    }
  }
  
  # Master authorized networks
  master_authorized_networks_config {
    dynamic "cidr_blocks" {
      for_each = var.master_authorized_networks
      content {
        cidr_block   = cidr_blocks.value.cidr_block
        display_name = cidr_blocks.value.display_name
      }
    }
    
    # Allow GCP services
    cidr_blocks {
      cidr_block   = "199.36.153.8/30"
      display_name = "GCP Health Checkers"
    }
  }
  
  # Workload Identity
  workload_identity_config {
    workload_pool = local.workload_identity_namespace
  }
  
  # Binary Authorization
  dynamic "binary_authorization" {
    for_each = var.enable_binary_authorization ? [1] : []
    content {
      evaluation_mode = "PROJECT_SINGLETON_POLICY_ENFORCE"
    }
  }
  
  # Security settings
  enable_shielded_nodes = var.enable_shielded_nodes
  
  # Network Policy
  network_policy {
    enabled  = var.enable_network_policy
    provider = var.enable_network_policy ? "CALICO" : "PROVIDER_UNSPECIFIED"
  }
  
  # Cluster addons
  addons_config {
    horizontal_pod_autoscaling {
      disabled = false
    }
    
    http_load_balancing {
      disabled = false
    }
    
    network_policy_config {
      disabled = !var.enable_network_policy
    }
    
    gce_persistent_disk_csi_driver_config {
      enabled = true
    }
    
    gcp_filestore_csi_driver_config {
      enabled = true
    }
    
    dns_cache_config {
      enabled = true
    }
    
    # Istio service mesh
    dynamic "istio_config" {
      for_each = var.enable_istio ? [1] : []
      content {
        disabled = false
        auth     = "AUTH_MUTUAL_TLS"
      }
    }
    
    # GKE Backup
    dynamic "gke_backup_agent_config" {
      for_each = var.enable_gke_backup ? [1] : []
      content {
        enabled = true
      }
    }
    
    # Config Management for GitOps
    dynamic "config_connector_config" {
      for_each = var.enable_config_sync ? [1] : []
      content {
        enabled = true
      }
    }
  }
  
  # Cluster autoscaling for node pools
  cluster_autoscaling {
    enabled = !var.enable_autopilot
    
    dynamic "resource_limits" {
      for_each = var.enable_autopilot ? [] : [1]
      content {
        resource_type = "cpu"
        minimum       = 4
        maximum       = 1000
      }
    }
    
    dynamic "resource_limits" {
      for_each = var.enable_autopilot ? [] : [1]
      content {
        resource_type = "memory"
        minimum       = 16
        maximum       = 4000
      }
    }
    
    dynamic "auto_provisioning_defaults" {
      for_each = var.enable_autopilot ? [] : [1]
      content {
        service_account = var.cluster_service_account
        oauth_scopes = [
          "https://www.googleapis.com/auth/cloud-platform"
        ]
        
        # Shielded instance config
        shielded_instance_config {
          enable_secure_boot          = true
          enable_integrity_monitoring = true
        }
        
        # Node management
        management {
          auto_upgrade = true
          auto_repair  = true
        }
      }
    }
  }
  
  # Logging and monitoring
  logging_config {
    enable_components = [
      "SYSTEM_COMPONENTS",
      "WORKLOADS",
      "APISERVER",
      "CONTROLLER_MANAGER",
      "SCHEDULER"
    ]
  }
  
  monitoring_config {
    enable_components = [
      "SYSTEM_COMPONENTS",
      "WORKLOADS",
      "APISERVER",
      "CONTROLLER_MANAGER",
      "SCHEDULER",
      "STORAGE",
      "HPA",
      "POD",
      "DAEMONSET",
      "DEPLOYMENT",
      "STATEFULSET"
    ]
    
    managed_prometheus {
      enabled = true
    }
  }
  
  # Maintenance policy
  maintenance_policy {
    daily_maintenance_window {
      start_time = "03:00"
    }
  }
  
  # Release channel for automatic updates
  release_channel {
    channel = var.environment == "production" ? "STABLE" : "REGULAR"
  }
  
  # Cost management
  cost_management_config {
    enabled = true
  }
  
  # Database encryption
  database_encryption {
    state    = "ENCRYPTED"
    key_name = var.database_encryption_key
  }
  
  # Resource labels
  resource_labels = merge(
    var.labels,
    {
      cluster-name = local.cluster_name
    }
  )
  
  lifecycle {
    ignore_changes = [
      initial_node_count,
      master_auth
    ]
  }
}

# Node pools for Standard clusters
resource "google_container_node_pool" "primary_nodes" {
  for_each = var.enable_autopilot ? {} : var.node_pools
  
  name       = each.key
  location   = var.region
  cluster    = google_container_cluster.primary.name
  
  # Node count and autoscaling
  initial_node_count = each.value.min_count
  
  autoscaling {
    min_node_count = each.value.min_count
    max_node_count = each.value.max_count
  }
  
  # Node configuration
  node_config {
    machine_type = each.value.machine_type
    disk_size_gb = each.value.disk_size_gb
    disk_type    = each.value.disk_type
    
    # Preemptible or Spot nodes
    preemptible = each.value.preemptible
    spot        = each.value.spot
    
    # Service account
    service_account = var.cluster_service_account
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
    
    # Metadata
    metadata = {
      disable-legacy-endpoints = "true"
    }
    
    # Workload Identity
    workload_metadata_config {
      mode = "GKE_METADATA"
    }
    
    # Shielded instance config
    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }
    
    # Sandbox config for additional isolation
    dynamic "sandbox_config" {
      for_each = each.value.labels["sandbox"] == "true" ? [1] : []
      content {
        sandbox_type = "gvisor"
      }
    }
    
    # Node taints
    dynamic "taint" {
      for_each = each.value.taints
      content {
        key    = taint.value.key
        value  = taint.value.value
        effect = taint.value.effect
      }
    }
    
    # Labels
    labels = merge(
      each.value.labels,
      var.labels
    )
    
    # Tags for firewall rules
    tags = ["gke-node", "${local.cluster_name}-node"]
  }
  
  # Node locations
  node_locations = length(each.value.node_locations) > 0 ? each.value.node_locations : null
  
  # Node management
  management {
    auto_repair  = true
    auto_upgrade = true
  }
  
  # Upgrade settings
  upgrade_settings {
    max_surge       = 1
    max_unavailable = 0
    strategy        = "SURGE"
  }
  
  lifecycle {
    create_before_destroy = true
    ignore_changes        = [initial_node_count]
  }
}

# Workload Identity bindings
resource "google_service_account_iam_member" "workload_identity_binding" {
  for_each = var.workload_identity_sa
  
  service_account_id = each.value.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${local.workload_identity_namespace}[${each.key}/${each.key}]"
}

# GKE Backup Plan
resource "google_gke_backup_backup_plan" "cluster_backup" {
  count = var.enable_gke_backup ? 1 : 0
  
  name     = "${local.cluster_name}-backup-plan"
  cluster  = google_container_cluster.primary.id
  location = var.region
  
  retention_policy {
    backup_delete_lock_days = 30
    backup_retain_days      = 90
  }
  
  backup_schedule {
    cron_schedule = "0 2 * * *" # Daily at 2 AM
  }
  
  backup_config {
    include_volume_data = true
    include_secrets     = true
    all_namespaces      = true
  }
}

# Fleet membership for multi-cluster management
resource "google_gke_hub_membership" "cluster_membership" {
  count = var.enable_config_sync ? 1 : 0
  
  membership_id = local.cluster_name
  
  endpoint {
    gke_cluster {
      resource_link = google_container_cluster.primary.id
    }
  }
}

# Config Management for GitOps
resource "google_gke_hub_feature" "configmanagement" {
  count = var.enable_config_sync ? 1 : 0
  
  name     = "configmanagement"
  location = "global"
  
  fleet_default_member_config {
    configmanagement {
      config_sync {
        source_format = "unstructured"
        git {
          sync_repo   = var.config_sync_repo
          sync_branch = var.config_sync_branch
          policy_dir  = var.config_sync_policy_dir
          secret_type = "gcpserviceaccount"
          gcp_service_account_email = var.config_sync_service_account
        }
      }
      
      policy_controller {
        enabled                    = true
        template_library_installed = true
        referential_rules_enabled  = true
      }
    }
  }
  
  depends_on = [google_gke_hub_membership.cluster_membership]
}