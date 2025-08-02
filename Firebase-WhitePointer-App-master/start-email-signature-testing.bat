@echo off
echo.
echo ================================================
echo   Email Signature Testing with Cloudflare Tunnel
echo ================================================
echo.
echo This will set up Cloudflare tunnel for testing email signature features
echo from external devices (mobile, tablet, etc.)
echo.
echo Prerequisites:
echo - Development server should be running (npm run dev)
echo - Port 9015 should be available
echo - cloudflared should be installed
echo.
pause
echo.
echo Starting Cloudflare tunnel for email signature testing...
echo.
echo Install cloudflared if not installed:
echo   Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
echo   Or use chocolatey: choco install cloudflared
echo.
echo Run manually:
echo   cloudflared tunnel --url http://localhost:9015
echo.
echo Then update your environment:
echo   node setup-cloudflare-url.js https://YOUR-TUNNEL-URL.trycloudflare.com
echo.

pause