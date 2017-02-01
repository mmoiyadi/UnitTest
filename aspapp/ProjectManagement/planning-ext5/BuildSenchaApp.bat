sencha app build development
IF ERRORLEVEL neq 0 GOTO NOT-THERE
rmdir .\build\temp /s /q
EXIT
:NOT-THERE
ECHO sencha build failed
EXIT