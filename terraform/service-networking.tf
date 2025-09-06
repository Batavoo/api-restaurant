resource "google_service_networking_connection" "private_vpc_connection" {
  service                 = "servicenetworking.googleapis.com"
  network                 = google_compute_network.vpc.id
  reserved_peering_ranges = [google_compute_global_address.private_ip_range.name]
}
