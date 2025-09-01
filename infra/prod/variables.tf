variable "project_id" {
  description = "ID do projeto GCP"
  type        = string
}

variable "region" {
  description = "Região do GCP"
  type        = string
  default     = "us-east1"
}

variable "image_url" {
  description = "URL da imagem docker"
  type        = string
}
