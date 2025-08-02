# Cloud SQL Module Outputs

output "instance_name" {
  description = "The name of the database instance"
  value       = google_sql_database_instance.postgres.name
}

output "instance_id" {
  description = "The ID of the database instance"
  value       = google_sql_database_instance.postgres.id
}

output "connection_name" {
  description = "The connection name of the database instance"
  value       = google_sql_database_instance.postgres.connection_name
}

output "private_ip_address" {
  description = "The private IP address of the database instance"
  value       = google_sql_database_instance.postgres.private_ip_address
}

output "postgres_password_secret_id" {
  description = "Secret Manager secret ID for the postgres password"
  value       = google_secret_manager_secret.db_password.secret_id
}

output "service_passwords_secret_ids" {
  description = "Secret Manager secret IDs for service passwords"
  value       = { for k, v in google_secret_manager_secret.service_passwords : k => v.secret_id }
}

output "database_names" {
  description = "Names of created databases"
  value       = [for db in google_sql_database.databases : db.name]
}

output "service_users" {
  description = "Service user names for each database"
  value       = { for k, v in google_sql_user.service_users : k => v.name }
}

output "read_replica_names" {
  description = "Names of read replicas"
  value       = { for k, v in google_sql_database_instance.read_replicas : k => v.name }
}

output "read_replica_connection_names" {
  description = "Connection names of read replicas"
  value       = { for k, v in google_sql_database_instance.read_replicas : k => v.connection_name }
}

output "read_replica_private_ips" {
  description = "Private IP addresses of read replicas"
  value       = { for k, v in google_sql_database_instance.read_replicas : k => v.private_ip_address }
}

output "monitoring_alert_policy_ids" {
  description = "IDs of monitoring alert policies"
  value       = { for k, v in google_monitoring_alert_policy.database_alerts : k => v.id }
}