provider "google" {
  project = var.project_id
  region  = var.region
}

module "cloudrun" {
  source = "../modules/cloudrun"

  project_id   = var.project_id
  region       = var.region
  service_name = "api-restaurant-dev"
  image_url    = var.image_url
  environment  = "development"
}

output "service_url" {
  value = module.cloudrun.service_url
}
