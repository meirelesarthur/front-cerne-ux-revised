SP=/tmp/claude-1000/-home-pietro-ambiente/573685d7-0cbe-45d5-82b6-020d81e9fd72/scratchpad
until grep -q ALLDONE $SP/runall.status 2>/dev/null; do sleep 5; done
cd /home/pietro/ambiente/GB.Cerne.FrontEnd
set -a; source .env.login; set +a
for s in s6-fin-editar-excluir s7-lista; do
  flock -w 3000 /tmp/gbcerne-suite.lock npx playwright test --config e2e/_102-legado/playwright.legado.config.ts $s > $SP/run-$s.log 2>&1
  echo "$s EXIT=$?" >> $SP/run2.status
done
echo ALLDONE2 >> $SP/run2.status
