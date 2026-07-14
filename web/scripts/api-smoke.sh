#!/usr/bin/env bash
# End-to-end parity smoke suite for the Next.js /api/v1 port (78 checks).
#
# Expects a DISPOSABLE Postgres database (it inserts roles/users directly) and
# the dev server running against it with local storage:
#
#   psql -U postgres -c "CREATE DATABASE biidp_next_smoke"
#   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/biidp_next_smoke npx prisma migrate deploy
#   DATABASE_URL=... STORAGE_BACKEND=local ENVIRONMENT=development \
#     LOCAL_STORAGE_PATH=./local-storage-smoke LOCAL_STORAGE_BASE_URL=http://127.0.0.1:3100 \
#     npx next dev -p 3100
#   bash scripts/api-smoke.sh
#
# Adjust API/PSQL below if your ports or psql path differ.
set -uo pipefail
API=http://127.0.0.1:3100/api/v1
PSQL="/c/Program Files/PostgreSQL/18/bin/psql"
export PGPASSWORD=postgres
DB="-h 127.0.0.1 -U postgres -d biidp_next_smoke -tA"

pass=0; fail=0
check() { # name expected actual
  if [ "$2" = "$3" ]; then pass=$((pass+1)); echo "PASS: $1";
  else fail=$((fail+1)); echo "FAIL: $1 (expected=$2 actual=$3)"; fi
}
jqget() { node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const j=JSON.parse(d);const v=$1;console.log(typeof v==='object'?JSON.stringify(v):v)}catch(e){console.log('PARSE_ERROR')}})"; }

req() { # method path token body -> writes body to /tmp-resp, echoes status
  local method=$1 path=$2 token=$3 body=$4
  local args=(-s -o /tmp/resp.json -w '%{http_code}' -X "$method" "$API$path" -H 'Content-Type: application/json')
  [ -n "$token" ] && args+=(-H "Authorization: Bearer $token")
  [ -n "$body" ] && args+=(-d "$body")
  curl "${args[@]}"
}

# --- auth ---
code=$(req POST /auth/register "" '{"email":"Smoke.User@Example.com","full_name":"Smoke User","password":"supersecret123"}')
check "register 201" 201 "$code"
TOKEN=$(cat /tmp/resp.json | jqget 'j.access_token')
USER_ID=$(cat /tmp/resp.json | jqget 'j.user.id')
ROLES=$(cat /tmp/resp.json | jqget 'j.user.roles[0]')
check "register role contributor" contributor "$ROLES"
EMAIL=$(cat /tmp/resp.json | jqget 'j.user.email')
check "register lowercases email" smoke.user@example.com "$EMAIL"

code=$(req POST /auth/register "" '{"email":"smoke.user@example.com","full_name":"Dup","password":"supersecret123"}')
check "register duplicate 409" 409 "$code"
check "409 detail" "Email is already registered" "$(cat /tmp/resp.json | jqget 'j.detail')"

code=$(req POST /auth/login "" '{"email":"smoke.user@example.com","password":"wrongpassword"}')
check "login bad password 401" 401 "$code"
code=$(req POST /auth/login "" '{"email":"smoke.user@example.com","password":"supersecret123"}')
check "login 200" 200 "$code"
code=$(req GET /auth/me "$TOKEN" "")
check "me 200" 200 "$code"
code=$(req GET /auth/me "" "")
check "me unauthenticated 401" 401 "$code"
code=$(req POST /auth/register "" '{"email":"bad","full_name":"x","password":"short"}')
check "register validation 422" 422 "$code"

# --- promote user to admin+reviewer via SQL (test fixture) ---
"$PSQL" $DB -c "INSERT INTO roles (id, name, description) VALUES (gen_random_uuid(),'admin','a'),(gen_random_uuid(),'reviewer','r') ON CONFLICT DO NOTHING" >/dev/null
"$PSQL" $DB -c "INSERT INTO user_roles (user_id, role_id) SELECT '$USER_ID', id FROM roles WHERE name IN ('admin','reviewer') ON CONFLICT DO NOTHING" >/dev/null

# --- taxonomy ---
code=$(req POST /language-groups "$TOKEN" '{"name":"Bantu"}')
check "create group 201" 201 "$code"
GROUP_ID=$(cat /tmp/resp.json | jqget 'j.id')
code=$(req POST /language-groups "$TOKEN" '{"name":"Bantu"}')
check "dup group 409" 409 "$code"
code=$(req POST /languages "$TOKEN" "{\"name\":\"Setswana\",\"local_name\":\"Setswana\",\"iso_code\":\"tsn\",\"group_id\":\"$GROUP_ID\"}")
check "create language 201" 201 "$code"
LANG_ID=$(cat /tmp/resp.json | jqget 'j.id')
code=$(req POST /languages "$TOKEN" '{"name":"Ghost","group_id":"00000000-0000-0000-0000-000000000000"}')
check "unknown group 422" 422 "$code"
code=$(req POST /languages "$TOKEN" '{"name":"English"}')
LANG2_ID=$(cat /tmp/resp.json | jqget 'j.id')
code=$(req PATCH "/languages/$LANG_ID" "$TOKEN" '{"description":"Bantu language of Botswana"}')
check "patch language 200" 200 "$code"
code=$(req GET "/languages/$LANG_ID" "" "")
check "get language 200" 200 "$code"
code=$(req GET "/languages/not-a-uuid" "" "")
check "get language bad uuid 422" 422 "$code"
code=$(req GET /languages "" "")
check "list languages 200" 200 "$code"
COUNT=$(cat /tmp/resp.json | jqget 'j.length')
check "list languages count" 2 "$COUNT"
code=$(req POST /dialects "$TOKEN" "{\"name\":\"Sengwato\",\"language_id\":\"$LANG_ID\"}")
check "create dialect 201" 201 "$code"
DIALECT_ID=$(cat /tmp/resp.json | jqget 'j.id')
code=$(req POST /speech-communities "$TOKEN" "{\"name\":\"Serowe\",\"district\":\"Central\",\"language_id\":\"$LANG_ID\",\"dialect_id\":\"$DIALECT_ID\"}")
check "create community 201" 201 "$code"
code=$(req POST /speech-communities "$TOKEN" "{\"name\":\"X\",\"dialect_id\":\"$DIALECT_ID\"}")
check "community dialect w/o language 422" 422 "$code"

# --- categories + contribution ---
code=$(req POST /categories "$TOKEN" '{"name":"Everyday speech"}')
check "create category 201" 201 "$code"
CAT_ID=$(cat /tmp/resp.json | jqget 'j.id')
code=$(req GET /categories "" "")
check "list categories 200" 200 "$code"

CONTRIB_BODY="{\"contribution_type\":\"translation\",\"title\":\"Greetings\",\"description\":\"Common greetings\",\"language_id\":\"$LANG_ID\",\"dialect_id\":\"$DIALECT_ID\",\"target_language_id\":\"$LANG2_ID\",\"category_id\":\"$CAT_ID\",\"domain\":\"daily life\",\"tags\":[\"greetings\"],\"source\":\"self\",\"license_type\":\"CC-BY-4.0\"}"
code=$(req POST /contributions "$TOKEN" "$CONTRIB_BODY")
check "create contribution 201" 201 "$code"
CONTRIB_ID=$(cat /tmp/resp.json | jqget 'j.id')
check "contribution status draft" draft "$(cat /tmp/resp.json | jqget 'j.status')"
check "contribution version 1" 1 "$(cat /tmp/resp.json | jqget 'j.version')"

code=$(req POST /contributions "$TOKEN" '{"contribution_type":"translation","title":"t","description":"d","language_id":"00000000-0000-0000-0000-000000000000","target_language_id":"00000000-0000-0000-0000-000000000000","category_id":"00000000-0000-0000-0000-000000000000","domain":"d","source":"s","license_type":"l"}')
check "contribution unknown language 422" 422 "$code"

# submit before consent -> 422 with missing list
code=$(req POST "/contributions/$CONTRIB_ID/submit" "$TOKEN" "")
check "submit incomplete 422" 422 "$code"
check "submit missing detail" '{"message":"Contribution is incomplete","missing":["consent","translation"]}' "$(cat /tmp/resp.json | jqget 'j.detail')"

# translation + consent
code=$(req POST /translations "$TOKEN" "{\"contribution_id\":\"$CONTRIB_ID\",\"source_text\":\"Dumela\",\"target_text\":\"Hello\"}")
check "create translation 201" 201 "$code"
TRANS_ID=$(cat /tmp/resp.json | jqget 'j.id')
code=$(req POST /translations "$TOKEN" "{\"contribution_id\":\"$CONTRIB_ID\",\"source_text\":\"x\",\"target_text\":\"y\"}")
check "dup translation 409" 409 "$code"
code=$(req GET "/translations/$TRANS_ID" "$TOKEN" "")
check "get translation 200" 200 "$code"
code=$(req POST "/contributions/$CONTRIB_ID/consent" "$TOKEN" '{"use_for_ai_training":true,"use_for_research":true,"use_for_commercial":false,"allow_open_release":true,"allow_attribution":true}')
check "consent 201" 201 "$code"
code=$(req POST "/contributions/$CONTRIB_ID/consent" "$TOKEN" '{"use_for_ai_training":true,"use_for_research":true,"use_for_commercial":false,"allow_open_release":true,"allow_attribution":true}')
check "dup consent 409" 409 "$code"

# submit
code=$(req POST "/contributions/$CONTRIB_ID/submit" "$TOKEN" "")
check "submit 200" 200 "$code"
check "status submitted" submitted "$(cat /tmp/resp.json | jqget 'j.status')"
code=$(req GET "/reviews/pending" "$TOKEN" "")
check "pending reviews 200" 200 "$code"
check "pending count 1" 1 "$(cat /tmp/resp.json | jqget 'j.length')"

# review approve -> coins
code=$(req POST "/contributions/$CONTRIB_ID/review" "$TOKEN" '{"action":"approve","quality_score":88.5,"notes":"good"}')
check "review 201" 201 "$code"
code=$(req GET /wallet "$TOKEN" "")
check "wallet 200" 200 "$code"
check "wallet earned 5" 5 "$(cat /tmp/resp.json | jqget 'j.earned_coins')"
check "wallet lifetime 5" 5 "$(cat /tmp/resp.json | jqget 'j.total_lifetime_coins')"
code=$(req GET /wallet/transactions "$TOKEN" "")
check "transactions 200" 200 "$code"
check "txn reason" "Approved translation" "$(cat /tmp/resp.json | jqget 'j[0].reason')"
code=$(req GET /leaderboard "" "")
check "leaderboard 200" 200 "$code"
check "leaderboard entry" '{"rank":1,"full_name":"Smoke User","coins":5}' "$(cat /tmp/resp.json | jqget 'j[0]')"
code=$(req POST "/contributions/$CONTRIB_ID/review" "$TOKEN" '{"action":"approve"}')
check "re-review 409" 409 "$code"

# --- conversation flow (second contribution) ---
CONV_BODY="{\"contribution_type\":\"conversation\",\"title\":\"Chat\",\"description\":\"d\",\"language_id\":\"$LANG_ID\",\"category_id\":\"$CAT_ID\",\"domain\":\"d\",\"source\":\"s\",\"license_type\":\"l\"}"
code=$(req POST /contributions "$TOKEN" "$CONV_BODY")
C2=$(cat /tmp/resp.json | jqget 'j.id')
code=$(req POST /conversations "$TOKEN" "{\"contribution_id\":\"$C2\",\"speaker_count\":2}")
check "conversation 201" 201 "$code"
CONV_ID=$(cat /tmp/resp.json | jqget 'j.id')
code=$(req POST "/conversations/$CONV_ID/turns" "$TOKEN" '{"turn_order":1,"speaker_label":"A","source_text":"Dumela"}')
check "turn 201" 201 "$code"
TURN_ID=$(cat /tmp/resp.json | jqget 'j.id')
code=$(req POST "/conversations/$CONV_ID/turns" "$TOKEN" '{"turn_order":1,"speaker_label":"B","source_text":"Agee"}')
check "dup turn order 409" 409 "$code"
code=$(req PATCH "/conversation-turns/$TURN_ID" "$TOKEN" '{"target_text":"Hello"}')
check "patch turn 200" 200 "$code"
code=$(req GET "/conversations/$CONV_ID" "$TOKEN" "")
check "conversation detail turns 1" 1 "$(cat /tmp/resp.json | jqget 'j.turns.length')"
code=$(req DELETE "/conversation-turns/$TURN_ID" "$TOKEN" "")
check "delete turn 204" 204 "$code"

# --- uploads (document contribution, local storage) ---
DOC_BODY="{\"contribution_type\":\"document\",\"title\":\"Doc\",\"description\":\"d\",\"language_id\":\"$LANG_ID\",\"category_id\":\"$CAT_ID\",\"domain\":\"d\",\"source\":\"s\",\"license_type\":\"l\"}"
code=$(req POST /contributions "$TOKEN" "$DOC_BODY")
C3=$(cat /tmp/resp.json | jqget 'j.id')
code=$(req POST /uploads/signed-url "$TOKEN" "{\"contribution_id\":\"$C3\",\"filename\":\"notes & stuff.txt\",\"content_type\":\"text/plain\",\"file_size\":11}")
check "signed-url 200" 200 "$code"
UPLOAD_URL=$(cat /tmp/resp.json | jqget 'j.upload_url')
UPLOAD_TOKEN=$(cat /tmp/resp.json | jqget 'j.upload_token')
code=$(req POST /uploads/signed-url "$TOKEN" "{\"contribution_id\":\"$C3\",\"filename\":\"x.exe\",\"content_type\":\"application/x-msdownload\",\"file_size\":11}")
check "signed-url bad type 415" 415 "$code"

code=$(curl -s -o /tmp/up.txt -w '%{http_code}' -X PUT "$UPLOAD_URL" -H 'Content-Type: text/plain' --data-binary 'hello world')
check "local upload 204" 204 "$code"
code=$(req POST /uploads/confirm "$TOKEN" "{\"upload_token\":\"$UPLOAD_TOKEN\"}")
check "confirm 201" 201 "$code"
ASSET_ID=$(cat /tmp/resp.json | jqget 'j.id')
check "asset media_type document" document "$(cat /tmp/resp.json | jqget 'j.media_type')"
code=$(req GET "/contributions/$C3/assets" "$TOKEN" "")
check "list assets 1" 1 "$(cat /tmp/resp.json | jqget 'j.length')"
code=$(req GET "/uploads/assets/$ASSET_ID/download-url" "$TOKEN" "")
check "download-url 200" 200 "$code"
DL_URL=$(cat /tmp/resp.json | jqget 'j.url')
BODY=$(curl -s "$DL_URL")
check "download roundtrip" "hello world" "$BODY"

# --- second user cannot access ---
code=$(req POST /auth/register "" '{"email":"other@example.com","full_name":"Other User","password":"supersecret123"}')
TOKEN2=$(cat /tmp/resp.json | jqget 'j.access_token')
code=$(req GET "/contributions/$C3" "$TOKEN2" "")
check "foreign contribution 403" 403 "$code"
code=$(req GET "/reviews/pending" "$TOKEN2" "")
check "reviews as contributor 403" 403 "$code"
code=$(req POST /categories "$TOKEN2" '{"name":"Nope"}')
check "category as contributor 403" 403 "$code"

# --- intelligence ---
code=$(req POST /synthetic-examples "$TOKEN" "{\"title\":\"Syn\",\"example_type\":\"translation\",\"content\":{\"a\":1},\"language_id\":\"$LANG_ID\",\"synthetic_source_model\":\"claude\"}")
check "synthetic 201" 201 "$code"
SYN_ID=$(cat /tmp/resp.json | jqget 'j.id')
code=$(req PATCH "/synthetic-examples/$SYN_ID/verify" "$TOKEN" "")
check "verify synthetic 200" 200 "$code"
check "verify status approved" approved "$(cat /tmp/resp.json | jqget 'j.review_status')"
code=$(req GET /synthetic-examples "" "")
check "list synthetic public 200" 200 "$code"

code=$(req POST /datasets "$TOKEN" "{\"name\":\"Approved translations\",\"language_id\":\"$LANG_ID\",\"contribution_type\":\"translation\"}")
check "dataset 201" 201 "$code"
DS_ID=$(cat /tmp/resp.json | jqget 'j.id')
code=$(req POST "/datasets/$DS_ID/export" "$TOKEN" "")
check "export 201" 201 "$code"
EXP_ID=$(cat /tmp/resp.json | jqget 'j.id')
check "export item_count 1" 1 "$(cat /tmp/resp.json | jqget 'j.item_count')"
code=$(curl -s -o /tmp/ndjson.txt -w '%{http_code}' "$API/dataset-exports/$EXP_ID/download" -H "Authorization: Bearer $TOKEN")
check "export download 200" 200 "$code"
check "ndjson has title" Greetings "$(cat /tmp/ndjson.txt | jqget 'j.title')"

code=$(req GET /admin/analytics "$TOKEN" "")
check "analytics 200" 200 "$code"
check "analytics approved 1" 1 "$(cat /tmp/resp.json | jqget 'j.approved_contributions')"
check "analytics contributors 2" 2 "$(cat /tmp/resp.json | jqget 'j.total_contributors')"
check "analytics coins 5" 5 "$(cat /tmp/resp.json | jqget 'j.coins_awarded')"

echo "-------------------"
echo "PASS=$pass FAIL=$fail"
