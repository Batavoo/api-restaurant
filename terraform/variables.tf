variable "gcp_project_name" {
  description = "The GCP project name where resources are deployed"
  type        = string
  default     = "pede-ja-api"
}

variable "gcp_region" {
  description = "The GCP region where resources are deployed"
  type        = string
  default     = "us-east1"
}

variable "github_repository" {
  description = "The GitHub repository in the format <org/repo>"
  type        = string
  default     = "Pos-Grad-Devops/api-restaurant"
}

# variable "api_bucket_object_name" {
#   description = "The name of the Cloud Storage object for the API function source code."
#   type        = string
#   default     = "api-function-source.zip"
# }
