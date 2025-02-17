/** @odoo-module */

import { registry } from "@web/core/registry";
import { downloadFile } from "@web/core/network/download";
import { downloadReport } from "@web/webclient/actions/reports/utils";

export const reportService = {
    dependencies: ["rpc", "user", "ui", "orm"],
    start(env, { rpc, user, ui, orm }) {
        const reportActionsCache = {};
        return {
            async download(reportXmlId, active_ids) {
                ui.block();
                try {
                    if (reportXmlId === "account.account_invoices"){
                        // Send and Print the invoices
                        let [pdf, filename] = await orm.call(
                            "account.move",
                            "generate_pdf_and_send_invoice",
                            [active_ids],
                        );
                        // Convert pdf to a Blob
                        const byteArray = new Uint8Array(pdf.length);
                        for (let i = 0; i < pdf.length; i++) {
                            byteArray[i] = pdf.charCodeAt(i);
                        }
                        const blob = new Blob([byteArray], {type: "application/pdf"});
                        // Show the popup to save the pdf
                        await downloadFile(blob, filename, "application/pdf");
                    } else {
                        reportActionsCache[reportXmlId] ||= rpc("/web/action/load", {
                        action_id: reportXmlId,
                        });
                        const reportAction = await reportActionsCache[reportXmlId];
                        // await instead of return because we want the ui to stay blocked
                        await downloadReport(
                            rpc,
                            { ...reportAction, context: { active_ids } },
                            "pdf",
                            user.context
                        );
                    }
                } finally {
                    ui.unblock();
                }
            },
        };
    },
};

registry.category("services").add("report", reportService);
