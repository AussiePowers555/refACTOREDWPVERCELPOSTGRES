# GKE Module Variables

variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "The GCP region"
  type        = string
}

variable "network" {
  description = "The VPC network name"
  type        = string
}

variable "subnetwork" {
  description = "The subnetwork name"
  type        = string
}

variable "cluster_service_account" {
  description = "Service account email for cluster nodes"
  type        = string
}

variable "workload_identity_sa" {
  description = "Map of workload identity service accounts"
  type        = map(any)
  default     = {}
}

variable "enable_autopilot" {
  description = "Enable GKE Autopilot mode"
  type        = bool
  default     = false
}

variable "enable_private_cluster" {
  description = "Enable private cluster"
  type        = bool
  default     = true
}

variable "master_ipv4_cidr_block" {
  description = "CIDR block for master network"
  type        = string
}

variable "master_authorized_networks" {
  description = "List of authorized networks for master access"
  type = list(object({
    cidr_block   = string
    display_name = string
  }))
  default = []
}

variable "node_pools" {
  description = "Node pool configurations"
  type        = map(any)
  default     = {}
}

variable "enable_binary_authorization" {
  description = "Enable Binary Authorization"
  type        = bool
  default     = true
}

variable "enable_shielded_nodes" {
  description = "Enable Shielded GKE nodes"
  type        = bool
  default     = true
}

variable "enable_network_policy" {
  description = "Enable network policy"
  type        = bool
  default     = true
}

variable "enable_istio" {
  description = "Enable Istio service mesh"
  type        = bool
  default     = false
}

variable "enable_gke_backup" {
  description = "Enable GKE backup"
  type        = bool
  default     = true
}

variable "enable_config_sync" {
  description = "Enable Config Sync for GitOps"
  type        = bool
  default     = false
}

variable "database_encryption_key" {
  description = "Cloud KMS key for database encryption"
  type        = string
  default     = ""
}

variable "labels" {
  description = "Resource labels"
  type        = map(string)
  default     = {}
}

# Config Sync variables
variable "config_sync_repo" {
  description = "Git repository URL for Config Sync"
  type        = string
  default     = ""
}

variable "config_sync_branch" {
  description = "Git branch for Config Sync"
  type        = string
  default     = "main"
}

variable "config_sync_policy_dir" {
  description = "Directory in repo containing policies"
  type        = string
  default     = "/"
}

variable "config_sync_service_account" {
  description = "Service account for Config Sync"
  type        = string
  default     = ""
}