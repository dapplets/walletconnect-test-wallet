import * as React from "react";
import styled from "styled-components";
import { convertHexToUtf8, convertHexToNumber } from "@walletconnect/utils";
import Column from "./Column";
import Button from "./Button";
import { apiFetchDapplet } from '../helpers/api';
import { getRenderer } from "../helpers/dapplets";

const SRequestValues = styled.div`
  font-family: monospace;
  width: 100%;
  font-size: 12px;
  background-color: #eee;
  padding: 8px;
  word-break: break-word;
  border-radius: 8px;
  margin-bottom: 10px;
`;

const SConnectedPeer = styled.div`
  display: flex;
  align-items: center;
  & img {
    width: 40px;
    height: 40px;
  }
  & > div {
    margin-left: 10px;
  }
`;

const SActions = styled.div`
  margin: 0;
  margin-top: 20px;

  display: flex;
  justify-content: space-around;
  & > * {
    margin: 0 5px;
  }
`;

const SDapplet = styled.div`
  width: 100%;
  padding: 20px 20px;
  background: rgb(255,255,255);
  border-radius: 6px;
  border-bottom-width: 1px;
  border-bottom-style: solid;
  border-bottom-color: rgba(12,12,13,0);
  box-shadow: 0px 2px 6px 0 rgba(0,0,0,0.1), 0 0 1px 0 rgba(50,50,93,0.02), -1px 2px 10px 0 rgba(59,59,92,0.15);
`;

class DisplayRequest extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { renderedDapplet: null };
  }

  public componentDidMount() {
    const me = this;
    const { displayRequest } = me.props;
    if (displayRequest.method === 'wallet_loadDapplet') {
      const dappletId = displayRequest.params[0];
      apiFetchDapplet(dappletId).then(dapplet => {
        displayRequest.params[2] = dapplet;
        const metaTx = displayRequest.params[1];

        let html = "Compatible Dapplet view is not found.";

        for (const view of dapplet.views) {
          if (!view["@type"]) { 
            continue;
          }
          
          const renderer = getRenderer(view["@type"]);
          
          if (renderer) {
            html = renderer(view.template, metaTx);
            break;
          }            
        }

        me.setState({ renderedDapplet: html });
      });
    }
  }
  public render() {
    const {
      displayRequest,
      peerMeta,
      approveRequest,
      rejectRequest
    } = this.props;

    let params = [{ label: "Method", value: displayRequest.method }];

    switch (displayRequest.method) {
      case "eth_sendTransaction":
      case "eth_signTransaction":
        params = [
          ...params,
          { label: "From", value: displayRequest.params[0].from },
          { label: "To", value: displayRequest.params[0].to },
          {
            label: "Gas Limit",
            value: displayRequest.params[0].gas
              ? convertHexToNumber(displayRequest.params[0].gas)
              : displayRequest.params[0].gasLimit
                ? convertHexToNumber(displayRequest.params[0].gasLimit)
                : ""
          },
          {
            label: "Gas Price",
            value: convertHexToNumber(displayRequest.params[0].gasPrice)
          },
          {
            label: "Nonce",
            value: convertHexToNumber(displayRequest.params[0].nonce)
          },
          {
            label: "Value",
            value: convertHexToNumber(displayRequest.params[0].value)
          },
          { label: "Data", value: displayRequest.params[0].data }
        ];
        break;

      case "eth_sign":
        params = [
          ...params,
          { label: "Address", value: displayRequest.params[0] },
          { label: "Message", value: displayRequest.params[1] }
        ];
        break;
      case "personal_sign":
        params = [
          ...params,
          { label: "Address", value: displayRequest.params[1] },
          {
            label: "Message",
            value: convertHexToUtf8(displayRequest.params[0])
          }
        ];
        break;
      // ToDo: DiP: load dapplet txMeta
      case "wallet_loadDapplet":
        break;
      default:
        params = [
          ...params,
          {
            label: "params",
            value: JSON.stringify(displayRequest.params, null, "\t")
          }
        ];
        break;
    }
    return (
      <Column>
        <h6>{"Request From"}</h6>
        <SConnectedPeer>
          <img src={peerMeta.icons[0]} alt={peerMeta.name} />
          <div>{peerMeta.name}</div>
        </SConnectedPeer>
        {
          (this.state.renderedDapplet) ? <div>
            <h6>{"Dapplet"}</h6>
            <SDapplet dangerouslySetInnerHTML={{ __html: this.state.renderedDapplet }} />
          </div> : null
        }
        {params.map(param => (
          <React.Fragment key={param.label}>
            <h6>{param.label}</h6>
            <SRequestValues>{param.value}</SRequestValues>
          </React.Fragment>
        ))}
        <SActions>
          <Button onClick={approveRequest}>{`Approve`}</Button>
          <Button onClick={rejectRequest}>{`Reject`}</Button>
        </SActions>
      </Column>
    );
  }
}

export default DisplayRequest;
