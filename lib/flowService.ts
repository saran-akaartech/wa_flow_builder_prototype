const GRAPH_URL = "https://graph.facebook.com/v23.0";


export const createFlow = async ({
    accessToken,
    wabaId,
    flowName,
    categories,
    flowJson,
    endpointUri,
    cloneFlowId,
}: {
    accessToken: string;
    wabaId: string;
    flowName: string;
    categories: string[];
    flowJson: object;
    endpointUri: string;
    cloneFlowId?: string;
}) => {

    const payload: any = {
        name: flowName,
        categories,
        flow_json: JSON.stringify(flowJson),
        endpoint_uri: endpointUri,
    };

    if (cloneFlowId) {
        payload.clone_flow_id = cloneFlowId;
    }

    const response = await fetch(`${GRAPH_URL}/${wabaId}/flows`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    return response.json();
};


export const updateFlowJson = async ({
    accessToken,
    flowId,
    flowJson,
}: {
    accessToken: string;
    flowId: string;
    flowJson: object;
}) => {

    const form = new FormData();

    form.append(
        "file",
        new Blob(
            [JSON.stringify(flowJson)],
            {
                type: "application/json",
            }
        ),
        "flow.json"
    );

    form.append("name", "flow.json");
    form.append("asset_type", "FLOW_JSON");

    const response = await fetch(`${GRAPH_URL}/${flowId}/assets`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
        },
        body: form,
    });

    return response.json();
};

export const publishFlow = async ({
    accessToken,
    flowId,
}: {
    accessToken: string;
    flowId: string;
}) => {

    const response = await fetch(
        `${GRAPH_URL}/${flowId}/publish`,
        {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
            },
        }
    );

    return response.json();
};

export const deleteFlow = async ({
    accessToken,
    flowId,
}: {
    accessToken: string;
    flowId: string;
}) => {

    const response = await fetch(`${GRAPH_URL}/${flowId}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${accessToken}`,
        },
    });

    return response.json();
};

export const getFlows = async ({
    accessToken,
    wabaId,
}: {
    accessToken: string;
    wabaId: string;
}) => {

    const response = await fetch(
        `${GRAPH_URL}/${wabaId}/flows`,
        {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
            },
        }
    );

    return response.json();
};

export const getFlowById = async ({
    accessToken,
    flowId,
}: {
    accessToken: string;
    flowId: string;
}) => {

    const fields = [
        "id",
        "name",
        "categories",
        "preview",
        "status",
        "validation_errors",
        "json_version",
        "data_api_version",
        "endpoint_uri",
        "whatsapp_business_account",
        "application",
        "health_status",
    ].join(",");

    const response = await fetch(
        `${GRAPH_URL}/${flowId}?fields=${fields}`,
        {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
            },
        }
    );

    return response.json();
};