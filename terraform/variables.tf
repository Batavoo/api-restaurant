variable "gcp_project_id" {
  description = "The ID of the GCP project."
  type        = string
  default     = "pede-ja-api"
}

variable "gcp_region" {
  description = "The GCP region where resources are deployed."
  type        = string
  default     = "us-east1"
}

# variable "api_bucket_object_name" {
#   description = "The name of the Cloud Storage object for the API function source code."
#   type        = string
#   default     = "api-function-source.zip"
# }
