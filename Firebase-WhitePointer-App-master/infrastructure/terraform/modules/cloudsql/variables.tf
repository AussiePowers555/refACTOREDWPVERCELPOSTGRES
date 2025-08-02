# Cloud SQL Module Variables

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

variable "network_id" {
  description = "The VPC network ID"
  type        = string
}

variable "database_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "POSTGRES_15"
}

variable "tier" {
  description = "Machine tier for the database instance"
  type        = string
  default     = "db-n1-standard-2"
}

variable "replica_tier" {
  description = "Machine tier for read replicas (defaults to primary tier)"
  type        = string
  default     = ""
}

variable "availability_type" {
  description = "Availability type (ZONAL or REGIONAL)"
  type        = string
  default     = "REGIONAL"
}

variable "disk_size_gb" {
  description = "Initial disk size in GB"
  type        = number
  default     = 100
}

variable "backup_enabled" {
  description = "Enable automated backups"
  type        = bool
  default     = true
}

variable "backup_start_time" {
  description = "Start time for backups (24-hour format)"
  type        = string
  default     = "03:00"
}

variable "point_in_time_recovery" {
  description = "Enable point-in-time recovery"
  type        = bool
  default     = true
}

variable "maintenance_window_day" {
  description = "Day of week for maintenance (1-7, 1 = Monday)"
  type        = number
  default     = 7
}

variable "maintenance_window_hour" {
  description = "Hour of day for maintenance (0-23)"
  type        = number
  default     = 4
}

variable "databases" {
  description = "List of databases to create"
  type        = list(string)
  default     = []
}

variable "read_replica_zones" {
  description = "Zones for read replicas"
  type        = set(string)
  default     = []
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = true
}

variable "additional_database_flags" {
  description = "Additional database flags"
  type        = map(string)
  default     = {}
}

variable "service_accounts" {
  description = "Service accounts that need database access"
  type        = map(string)
  default     = {}
}

variable "enable_monitoring" {
  description = "Enable monitoring alerts"
  type        = bool
  default     = true
}

variable "notification_channels" {
  description = "Notification channels for alerts"
  type        = list(string)
  default     = []
}

variable "labels" {
  description = "Resource labels"
  type        = map(string)
  default     = {}
}