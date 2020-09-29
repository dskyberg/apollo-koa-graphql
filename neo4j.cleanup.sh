docker rm -v -f neo4j 2>/dev/null
rm -rf neo4j/data 2>/dev/null
rm -rf neo4j/logs 2>/dev/null
mkdir -p neo4j/data
mkdir neo4j/logs
