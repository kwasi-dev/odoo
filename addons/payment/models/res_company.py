# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models


class ResCompany(models.Model):
    _inherit = 'res.company'

    payment_onboarding_payment_method = fields.Selection(
        string="Selected onboarding payment method",
        selection=[
            ('paypal', "PayPal"),
            ('stripe', "Stripe"),
            ('manual', "Manual"),
            ('other', "Other"),
        ])

    def _run_payment_onboarding_step(self, menu_id):
        """ Install the suggested payment modules and configure the providers.

        It's checked that the current company has a Chart of Account.

        :param int menu_id: The menu from which the user started the onboarding step, as an
                            `ir.ui.menu` id
        :return: The action returned by `action_stripe_connect_account`
        :rtype: dict
        """
        self.env.company.get_chart_of_accounts_or_fail()

        self._install_modules(['payment_stripe', 'account_payment'])

        # Create a new env including the freshly installed module(s)
        new_env = api.Environment(self.env.cr, self.env.uid, self.env.context)

        # Configure Stripe
        default_journal = new_env['account.journal'].search([
            *self.env['account.journal']._check_company_domain(new_env.company),
            ('type', '=', 'bank'),
        ], limit=1)

        stripe_provider = new_env['payment.provider'].search([
            *self.env['payment.provider']._check_company_domain(self.env.company),
            ('code', '=', 'stripe')
        ], limit=1)
        if not stripe_provider:
            base_provider = self.env.ref('payment.payment_provider_stripe')
            # Use sudo to access payment provider record that can be in different company.
            stripe_provider = base_provider.sudo().copy(default={'company_id': self.env.company.id})
        stripe_provider.journal_id = stripe_provider.journal_id or default_journal

        return stripe_provider.action_stripe_connect_account(menu_id=menu_id)

    def _install_modules(self, module_names):
        modules_sudo = self.env['ir.module.module'].sudo().search([('name', 'in', module_names)])
        STATES = ['installed', 'to install', 'to upgrade']
        modules_sudo.filtered(lambda m: m.state not in STATES).button_immediate_install()
