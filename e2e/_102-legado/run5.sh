SP=/tmp/claude-1000/-home-pietro-ambiente/573685d7-0cbe-45d5-82b6-020d81e9fd72/scratchpad
until grep -q ALLDONE6 $SP/run6.status 2>/dev/null; do sleep 5; done
cd /home/pietro/ambiente/GB.Cerne.FrontEnd
set -a; source .env.login; set +a
flock -w 3000 /tmp/gbcerne-suite.lock npx playwright test --config e2e/_102-legado/playwright.legado.config.ts s9-cleanup > $SP/run-s9.log 2>&1; echo "s9 EXIT=$?" >> $SP/run5.status
echo ALLDONE5 >> $SP/run5.status
