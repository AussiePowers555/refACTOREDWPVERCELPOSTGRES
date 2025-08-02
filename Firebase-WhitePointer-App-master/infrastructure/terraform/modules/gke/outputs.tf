# GKE Module Outputs

output "cluster_id" {
  description = "The GKE cluster ID"
  value       = google_container_cluster.primary.id
}

output "cluster_name" {
  description = "The GKE cluster name"
  value       = google_container_cluster.primary.name
}

output "cluster_endpoint" {
  description = "The GKE cluster endpoint"
  value       = google_container_cluster.primary.endpoint
  sensitive   = true
}

output "cluster_ca_certificate" {
  description = "The cluster CA certificate"
  value       = google_container_cluster.primary.master_auth[0].cluster_ca_certificate
  sensitive   = true
}

output "cluster_zone" {
  description = "The GKE cluster zone/region"
  value       = google_container_cluster.primary.location
}

output "node_pools" {
  description = "Information about the node pools"
  value = {
    for k, v in google_container_node_pool.primary_nodes : k => {
      name              = v.name
      initial_node_count = v.initial_node_count
      node_count        = v.node_count
      status            = v.status
    }
  }
}

output "workload_identity_namespace" {
  description = "Workload Identity namespace"
  value       = local.workload_identity_namespace
}

output "service_account_emails" {
  description = "Service account emails for workload identity"
  value       = { for k, v in var.workload_identity_sa : k => v.email }
}

output "backup_plan_id" {
  description = "GKE backup plan ID"
  value       = var.enable_gke_backup ? google_gke_backup_backup_plan.cluster_backup[0].id : null
}

output "fleet_membership_id" {
  description = "Fleet membership ID for multi-cluster management"
  value       = var.enable_config_sync ? google_gke_hub_membership.cluster_membership[0].id : null
}