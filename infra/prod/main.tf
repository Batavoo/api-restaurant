provider "google" {
  project = var.project_id
  region  = var.region
}

module "cloudrun" {
  source = "../modules/cloudrun"

  project_id   = var.project_id
  region       = var.region
  service_name = "api-restaurant-prod"
  image_url    = var.image_url
  environment  = "production"
}

module "cloudiam" {
  source = "../modules/cloudiam"

  github_repository_name = var.github_repository_name
}

output "service_url" {
  value = module.cloudrun.service_url
}
