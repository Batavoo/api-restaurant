variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "Google Cloud region"
  type        = string
  default     = "us-east1"
}

variable "service_account_email" {
  description = "Service account email para dar permissão ao bucket"
  type        = string
}
