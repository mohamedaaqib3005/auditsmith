# Deploying Auditsmith

The whole errand, in order. Anything written like yourdomain.com or
YOUR-SERVER-IP is a placeholder: replace it with your real value,
never type it literally.

1. Rent a box. Any Ubuntu VPS with 4 GB RAM (Playwright needs the
   memory): Hetzner CX22 (~5 EUR/mo) or DigitalOcean 4GB (~24 USD/mo)
   both work. You get an IP address and root SSH access.

2. Point the domain. At your DNS provider, add an A record:
   yourdomain.com -> YOUR-SERVER-IP. (Do this early; it takes time
   to spread.)

3. SSH in and run the kit:
   ssh root@YOUR-SERVER-IP
   git clone https://github.com/mohamedaaqib3005/auditsmith.git /tmp/a
   bash /tmp/a/deploy/setup.sh

4. Keys: create /home/audit/auditsmith/.env with the three keys the
   guide lists. Never commit this file.

5. Domain into Caddy: edit deploy/Caddyfile (real domain on line 1),
   copy it to /etc/caddy/Caddyfile, restart caddy. Caddy fetches the
   HTTPS certificate by itself.

6. Start:  systemctl start auditsmith
   Visit https://yourdomain.com. The page, the box, the product.

Ops notes: journalctl -u auditsmith -f tails the logs; the service
restarts itself on crashes and on reboot; git pull + systemctl restart
auditsmith ships updates; jobs/ accumulates PDFs, clear it occasionally.
