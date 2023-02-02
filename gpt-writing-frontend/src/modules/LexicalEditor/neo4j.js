const neo4j = require('neo4j-driver');

const uri = 'neo4j+s://8d7d9f6b.databases.neo4j.io:7687';
const user = 'neo4j';
const password = 'zz498270958';

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

export async function addDependency(sbj_node, obj_node, type) {
    const session = driver.session({ database: 'neo4j' });
    // Record the dependency from sub_node to obj_node to neo4j database

    try {
        if (['elaboratedBy', 'exemplifiedBy'].includes(type)) {
            const writeQuery = `MERGE (n1:TextNode { content: "${sbj_node.getTextContent()}", key: ${sbj_node.getKey()} })
            MERGE (n2:TextNode { content: "${obj_node.getTextContent()}", key: ${obj_node.getKey()} })
            MERGE (n1)-[r:${type}]->(n2)
            RETURN n1, n2`;

            const writeResult = await session.executeWrite(tx =>
                tx.run(writeQuery)
            );

            writeResult.records.forEach(record => {
                const textNode1 = record.get('n1');
                const textNode2 = record.get('n2');
                console.info(`Created dependency between: (Node : ${textNode1.properties.content}), (Node: ${textNode2.properties.content}) `);
            });

        } else {
            throw new Error('Type is not in the list of valid dependency types')
        }
    } catch (error) {
        console.log(error);
    }

}

export async function getDependencies(node, type=null) {

    // Get dependency of a particular node. Type is optional

    const session = driver.session({ database: 'neo4j' });

    try {
        let readQuery;
        if (!type) {
            readQuery = `MATCH (n1:TextNode)-[r]->(n2:TextNode)
            WHERE n1.key = ${node.getKey()}
            RETURN n1, r, n2`;
        } else {
            readQuery = `MATCH (n1:TextNode)-[r: ${type}]->(n2:TextNode)
            WHERE n1.key = ${node.getKey()}
            RETURN n1, r, n2`;
        }


        const readResult = await session.executeRead(tx =>
            tx.run(readQuery)
        ).then(res => {
            console.log("executed readQuery");
            // console.log(res.records);
            return res.records;
        });

        return readResult;
    }
    catch (error) {
        console.log(error);
    }
}