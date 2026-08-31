# Tasks: Motorcycle Comparison

## Backend (Phase 2)
- [ ] Design PostgreSQL schema (bikes, brands, categories, specs, spec groups/definitions)
- [ ] Create EF Core migrations (Motorcycle.Infrastructure)
- [ ] Implement bike repository and service
- [ ] Implement spec filtering strategy pattern
- [ ] Build GET /api/bikes (list + filter + pagination)
- [ ] Build GET /api/bikes/{slug} (detail)
- [ ] Build GET /api/bikes/compare (comparison matrix)
- [ ] Build GET /api/spec-groups, /brands, /categories
- [ ] Add caching for metadata endpoints
- [ ] Seed sample data

## Frontend (Phase 3)
- [ ] Setup Next.js + Tailwind CSS with theme tokens
- [ ] Build layout components (Header, Sidebar, PageShell, Button)
- [ ] Implement API client (typed)
- [ ] Build /bikes page (list + filters + search)
- [ ] Build /bikes/[slug] page (detail + image gallery)
- [ ] Build /compare page (bike picker + comparison view)
- [ ] Build / page (home with featured bikes)
- [ ] Mobile responsiveness testing
- [ ] SEO metadata per page

## Infrastructure (Phase 4)
- [ ] Provision PostgreSQL Flexible Server
- [ ] Provision Blob Storage + public container
- [ ] Provision Key Vault + managed identity
- [ ] Setup App Service Plan + Web Apps
- [ ] Configure CI/CD workflows (.github/workflows)
- [ ] Deploy and verify endpoints
