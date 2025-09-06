terraform {
  required_providers {
    # archive = {
    #   source  = "hashicorp/archive"
    #   version = "2.7.1"
    # }

    google = {
      source  = "hashicorp/google"
      version = "7.1.1"
    }
  }
}

provider "google" {
  project = var.project_name
  region  = var.region
}

data "google_project" "project" {}

resource "google_project_service" "required_apis" {
  for_each = toset([
    "compute.googleapis.com",
    "dns.googleapis.com",
    "secretmanager.googleapis.com",
    "servicenetworking.googleapis.com"
  ])
  service = each.key
}
