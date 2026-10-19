SP=/tmp/claude-1000/-home-pietro-ambiente/573685d7-0cbe-45d5-82b6-020d81e9fd72/scratchpad
until grep -q ALLDONE6 $SP/run6.status 2>/dev/null; do sleep 5; done
cd /home/pietro/ambiente/GB.Cerne.FrontEnd
set -a; source .env.login; set +a
C=e2e/_102-legado/playwright.legado.config.ts
DRAFT_ONLY=1 flock -w 3000 /tmp/gbcerne-suite.lock npx playwright test --config $C s2-mov-fin -g "E3" > $SP/run-s2e3.log 2>&1; echo "s2e3 EXIT=$?" >> $SP/run7.status
TIPO6=S START6=7 flock -w 3000 /tmp/gbcerne-suite.lock npx playwright test --config $C s6-fin-editar-excluir > $SP/run-s6b.log 2>&1; echo "s6b EXIT=$?" >> $SP/run7.status
flock -w 3000 /tmp/gbcerne-suite.lock npx playwright test --config $C s9-cleanup > $SP/run-s9.log 2>&1; echo "s9 EXIT=$?" >> $SP/run7.status
echo ALLDONE7 >> $SP/run7.status
