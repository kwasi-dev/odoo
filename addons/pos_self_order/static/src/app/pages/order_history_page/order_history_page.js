/** @odoo-module */

import { Component, useState } from "@odoo/owl";
import { useSelfOrder } from "@pos_self_order/app/self_order_service";
import { _t } from "@web/core/l10n/translation";
import { useService } from "@web/core/utils/hooks";

export class OrdersHistoryPage extends Component {
    static template = "pos_self_order.OrdersHistoryPage";

    async setup() {
        this.selfOrder = useSelfOrder();
        this.router = useService("router");
        this.state = useState({
            loadingProgress: true,
        });

        await this.loadOrder();
    }

    async loadOrder() {
        await this.selfOrder.getOrdersFromServer();
        this.state.loadingProgress = false;
    }

    get orders() {
        return this.selfOrder.orders.filter((o) => o.access_token).sort((a, b) => b.id - a.id);
    }

    get lines() {
        return this.order.lines;
    }

    getPrice(line) {
        return this.selfOrder.show_prices_with_tax_included
            ? line.price_subtotal_incl
            : line.price_subtotal;
    }

    clickOnLine(order, line) {
        this.selfOrder.editedLine = line;
        if (order.state === "draft") {
            this.selfOrder.editedOrder = order;
            this.router.navigate("product", { id: line.product_id });
        } else {
            this.selfOrder.notification.add(_t("You cannot edit an posted order!"), {
                type: "danger",
            });
        }
    }

    getNameAndDescription(line) {
        const fullName = line.full_product_name;
        const regex = /\(([^()]+)\)[^(]*$/;
        const matches = fullName.match(regex);

        if (matches && matches.length > 1) {
            const attributes = matches[matches.length - 1].trim();
            const productName = fullName.replace(matches[0], "").trim();
            return { productName, attributes };
        }

        return { productName: fullName, attributes: "" };
    }

    editOrder(order) {
        if (order.state === "draft") {
            this.selfOrder.editedOrder = order;
            this.router.navigate("productList");
        }
    }

    back() {
        this.router.navigate("default");
    }
}
