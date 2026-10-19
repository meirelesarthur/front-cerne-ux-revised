SP=/tmp/claude-1000/-home-pietro-ambiente/573685d7-0cbe-45d5-82b6-020d81e9fd72/scratchpad
until grep -q ALLDONE3 $SP/run3.status 2>/dev/null; do sleep 5; done
cd /home/pietro/ambiente/GB.Cerne.FrontEnd
set -a; source .env.login; set +a
flock -w 3000 /tmp/gbcerne-suite.lock npx playwright test --config e2e/_102-legado/playwright.legado.config.ts s3c-transf-edit > $SP/run-s3c.log 2>&1; echo "s3c EXIT=$?" >> $SP/run4.status
echo ALLDONE4 >> $SP/run4.status
