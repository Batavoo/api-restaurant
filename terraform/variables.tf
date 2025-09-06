variable "project_name" {
  description = "The GCP project name"
  type        = string
  default     = "pede-ja-api"
}

variable "region" {
  description = "The GCP region where resources are deployed"
  type        = string
  default     = "us-east1"
}

variable "zone" {
  description = "The GCP zone where resources are deployed"
  type        = string
  default     = "us-east1-b"
}

variable "github_repository_name" {
  description = "The GitHub repository name in the format <org/repo>"
  type        = string
  default     = "Pos-Grad-Devops/api-restaurant"
}

# variable "api_bucket_object_name" {
#   description = "The name of the Cloud Storage object for the API function source code."
#   type        = string
#   default     = "api-function-source.zip"
# }

variable "db_name" {
  description = "The name of the database"
  type        = string
  default     = "sonarqube"
}

variable "db_user" {
  description = "The database user"
  type        = string
  default     = "sonar"
}

variable "db_password" {
  description = "The database password stored in Secret Manager"
  type        = string
  default     = "sonarpass" # TODO: remover daqui.
}
