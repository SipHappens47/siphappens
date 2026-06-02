@echo off
echo Adding Windows Firewall rule for SipHappens (ports 3000 and 8081)...
netsh advfirewall firewall add rule name="SipHappens Dev" dir=in action=allow protocol=TCP localport=3000,8081
echo.
echo Done. If you see "Ok." above, the rule was added successfully.
echo You can close this window.
pause
