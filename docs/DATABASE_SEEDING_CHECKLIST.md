# Database Seeding Checklist

- [x] Schema audited
- [x] Factories created/updated
- [x] Roles and permissions seeded
- [x] Users seeded
- [x] Settings seeded
- [x] Locations and pricing seeded
- [x] Merchants seeded
- [x] Drivers seeded
- [x] Warehouses/products/inventory seeded
- [x] Orders seeded
- [x] Shipments seeded
- [x] Driver manifests seeded
- [x] Finance data seeded
- [x] Warehouse operations seeded
- [x] Audit logs seeded
- [x] Exports/attachments seeded or skipped with reason
- [ ] SEEDING_GUIDE.md created
- [ ] migrate:fresh --seed passed
- [ ] route:list passed
- [ ] tests passed or skipped with reason

## Notes

- Fixed warehouse bin barcode duplicate issue by generating globally unique bin barcodes.
- Test environment requires its own non-production `APP_KEY`; see `.env.testing`.
- Validation items remain unchecked because commands were not run in this turn.
