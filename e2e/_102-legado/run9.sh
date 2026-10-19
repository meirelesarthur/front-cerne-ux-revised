SP=/tmp/claude-1000/-home-pietro-ambiente/573685d7-0cbe-45d5-82b6-020d81e9fd72/scratchpad
cd /home/pietro/ambiente/GB.Cerne.FrontEnd
set -a; source .env.login; set +a
C=e2e/_102-legado/playwright.legado.config.ts
ONLY=C02,C03,C04,C05,C06,C07,C10,C11 flock -w 3000 /tmp/gbcerne-suite.lock npx playwright test --config $C s5-exp-pag -g E12 > $SP/run-s5d.log 2>&1; echo "s5d EXIT=$?" >> $SP/run9.status
flock -w 3000 /tmp/gbcerne-suite.lock npx playwright test --config $C s9-cleanup > $SP/run-s9c.log 2>&1; echo "s9c EXIT=$?" >> $SP/run9.status
echo ALLDONE9 >> $SP/run9.status
