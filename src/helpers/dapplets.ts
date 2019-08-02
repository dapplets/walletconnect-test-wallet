import * as ethers from "ethers";

// functions accessible from dapplet context

export function sha256 ( forHash: any[]) : string {
    return ethers.utils.sha256(
        ethers.utils.arrayify(
            forHash.map(e=>ethers.utils.sha256(ethers.utils.toUtf8Bytes(e))).join()
        )
    );
}