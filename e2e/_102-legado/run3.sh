SP=/tmp/claude-1000/-home-pietro-ambiente/573685d7-0cbe-45d5-82b6-020d81e9fd72/scratchpad
until grep -q ALLDONE $SP/runall.status 2>/dev/null; do sleep 5; done
cd /home/pietro/ambiente/GB.Cerne.FrontEnd
set -a; source .env.login; set +a
C=e2e/_102-legado/playwright.legado.config.ts
flock -w 3000 /tmp/gbcerne-suite.lock npx playwright test --config $C s8-rateio -g E8b > $SP/run-s8b.log 2>&1; echo "s8b EXIT=$?" >> $SP/run3.status
DRAFT_ONLY=1 flock -w 3000 /tmp/gbcerne-suite.lock npx playwright test --config $C s2-mov-fin > $SP/run-s2d.log 2>&1; echo "s2d EXIT=$?" >> $SP/run3.status
flock -w 3000 /tmp/gbcerne-suite.lock npx playwright test --config $C s6-fin-editar-excluir > $SP/run-s6.log 2>&1; echo "s6 EXIT=$?" >> $SP/run3.status
flock -w 3000 /tmp/gbcerne-suite.lock npx playwright test --config $C s7-lista > $SP/run-s7.log 2>&1; echo "s7 EXIT=$?" >> $SP/run3.status
echo ALLDONE3 >> $SP/run3.status
