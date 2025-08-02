# Cloud SQL PostgreSQL Module - Enterprise Database Infrastructure

locals {
  instance_name = "${var.environment}-postgres-primary"
  
  # Database flags for optimization
  database_flags = merge(
    {
      # Connection pooling
      "max_connections"                = "500"
      "pgbouncer.enabled"             = "on"
      
      # Performance tuning
      "shared_buffers"                = "256MB"
      "effective_cache_size"          = "1GB"
      "maintenance_work_mem"          = "256MB"
      "work_mem"                      = "16MB"
      "wal_buffers"                   = "16MB"
      "checkpoint_completion_target"   = "0.9"
      
      # Query optimization
      "random_page_cost"              = "1.1"
      "effective_io_concurrency"      = "200"
      "default_statistics_target"     = "100"
      
      # Logging for monitoring
      "log_statement"                 = "all"
      "log_duration"                  = "on"
      "log_min_duration_statement"    = "100"
      "log_checkpoints"               = "on"
      "log_connections"               = "on"
      "log_disconnections"            = "on"
      "log_lock_waits"               = "on"
      "log_temp_files"               = "0"
      
      # Security
      "ssl"                          = "on"
      "ssl_min_protocol_version"     = "TLSv1.2"
    },
    var.additional_database_flags
  )
}

# Random password for database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Store password in Secret Manager
resource "google_secret_manager_secret" "db_password" {
  secret_id = "${var.environment}-postgres-password"
  
  replication {
    automatic = true
  }
  
  labels = var.labels
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db_password.result
}

# Private VPC connection for Cloud SQL
resource "google_compute_global_address" "private_ip_address" {
  name          = "${var.environment}-postgres-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = var.network_id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = var.network_id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]
}

# Cloud SQL Instance
resource "google_sql_database_instance" "postgres" {
  name             = local.instance_name
  database_version = var.database_version
  region           = var.region
  
  settings {
    tier              = var.tier
    availability_type = var.availability_type
    disk_type         = "PD_SSD"
    disk_size         = var.disk_size_gb
    disk_autoresize   = true
    
    # Backup configuration
    backup_configuration {
      enabled                        = var.backup_enabled
      start_time                     = var.backup_start_time
      point_in_time_recovery_enabled = var.point_in_time_recovery
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 30
        retention_unit   = "COUNT"
      }
    }
    
    # Maintenance window
    maintenance_window {
      day          = var.maintenance_window_day
      hour         = var.maintenance_window_hour
      update_track = "stable"
    }
    
    # IP configuration - Private IP only
    ip_configuration {
      ipv4_enabled    = false
      private_network = var.network_id
      require_ssl     = true
    }
    
    # Database flags
    dynamic "database_flags" {
      for_each = local.database_flags
      content {
        name  = database_flags.key
        value = database_flags.value
      }
    }
    
    # Insights configuration
    insights_config {
      query_insights_enabled  = true
      query_plans_per_minute  = 5
      query_string_length     = 1024
      record_application_tags = true
      record_client_address   = true
    }
    
    # User labels
    user_labels = var.labels
  }
  
  deletion_protection = var.deletion_protection
  
  depends_on = [google_service_networking_connection.private_vpc_connection]
  
  lifecycle {
    ignore_changes = [
      settings[0].disk_size
    ]
  }
}

# Read replicas for high availability
resource "google_sql_database_instance" "read_replicas" {
  for_each = var.read_replica_zones
  
  name                 = "${local.instance_name}-replica-${each.key}"
  database_version     = var.database_version
  region              = var.region
  master_instance_name = google_sql_database_instance.postgres.name
  
  replica_configuration {
    failover_target = false
  }
  
  settings {
    tier              = var.replica_tier != "" ? var.replica_tier : var.tier
    availability_type = "ZONAL"
    disk_type         = "PD_SSD"
    disk_size         = var.disk_size_gb
    disk_autoresize   = true
    
    # IP configuration - Private IP only
    ip_configuration {
      ipv4_enabled    = false
      private_network = var.network_id
      require_ssl     = true
    }
    
    # Database flags (same as primary)
    dynamic "database_flags" {
      for_each = local.database_flags
      content {
        name  = database_flags.key
        value = database_flags.value
      }
    }
    
    # Insights configuration
    insights_config {
      query_insights_enabled  = true
      query_plans_per_minute  = 5
      query_string_length     = 1024
      record_application_tags = true
      record_client_address   = true
    }
    
    # User labels
    user_labels = merge(
      var.labels,
      {
        replica-zone = each.key
      }
    )
  }
  
  depends_on = [google_sql_database_instance.postgres]
}

# Database user
resource "google_sql_user" "postgres" {
  name     = "postgres"
  instance = google_sql_database_instance.postgres.name
  password = random_password.db_password.result
}

# Application databases
resource "google_sql_database" "databases" {
  for_each = toset(var.databases)
  
  name     = each.value
  instance = google_sql_database_instance.postgres.name
  
  lifecycle {
    prevent_destroy = true
  }
}

# Additional database users for microservices
resource "random_password" "service_passwords" {
  for_each = toset(var.databases)
  
  length  = 24
  special = true
}

resource "google_sql_user" "service_users" {
  for_each = toset(var.databases)
  
  name     = "${each.value}_service"
  instance = google_sql_database_instance.postgres.name
  password = random_password.service_passwords[each.key].result
}

# Store service passwords in Secret Manager
resource "google_secret_manager_secret" "service_passwords" {
  for_each = toset(var.databases)
  
  secret_id = "${var.environment}-${each.value}-db-password"
  
  replication {
    automatic = true
  }
  
  labels = var.labels
}

resource "google_secret_manager_secret_version" "service_passwords" {
  for_each = toset(var.databases)
  
  secret      = google_secret_manager_secret.service_passwords[each.key].id
  secret_data = random_password.service_passwords[each.key].result
}

# IAM binding for service accounts to access the database
resource "google_sql_database_instance_iam_member" "cloud_sql_client" {
  for_each = var.service_accounts
  
  instance = google_sql_database_instance.postgres.name
  role     = "roles/cloudsql.client"
  member   = "serviceAccount:${each.value}"
}

# Monitoring alerts
resource "google_monitoring_alert_policy" "database_alerts" {
  for_each = var.enable_monitoring ? toset([
    "cpu_utilization",
    "memory_utilization",
    "disk_utilization",
    "connection_count",
    "replication_lag"
  ]) : []
  
  display_name = "${var.environment} PostgreSQL - ${replace(each.key, "_", " ")} Alert"
  combiner     = "OR"
  
  conditions {
    display_name = "${replace(each.key, "_", " ")} exceeds threshold"
    
    condition_threshold {
      filter = "resource.type = \"cloudsql_database\" AND metric.type = \"cloudsql.googleapis.com/database/${each.key}\""
      
      aggregations {
        alignment_period   = "300s"
        per_series_aligner = "ALIGN_MEAN"
      }
      
      comparison = "COMPARISON_GT"
      threshold_value = lookup({
        cpu_utilization    = 0.8
        memory_utilization = 0.9
        disk_utilization   = 0.85
        connection_count   = 400
        replication_lag    = 300
      }, each.key, 0.8)
      
      duration = "300s"
    }
  }
  
  notification_channels = var.notification_channels
  
  documentation {
    content = "The ${replace(each.key, "_", " ")} for Cloud SQL instance ${local.instance_name} has exceeded the threshold."
  }
}