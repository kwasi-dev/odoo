/** @odoo-module **/

// ensure mail override is applied first.
import '@mail/../tests/helpers/mock_server/models/res_users';

import { patch } from "@web/core/utils/patch";
import { MockServer } from '@web/../tests/helpers/mock_server';

import { datetime_to_str } from '@web/legacy/js/core/time';

patch(MockServer.prototype, {
    /**
     * Simulates `_systray_get_calendar_event_domain` on `res.users`.
     *
     * @private
     */
    _mockResUsers_SystrayGetCalendarEventDomain() {
        const startDate = new Date();
        startDate.setUTCHours(0, 0, 0, 0);
        const endDate = new Date();
        endDate.setUTCHours(23, 59, 59, 999);
        const currentPartnerAttendeeIds = this.pyEnv['calendar.attendee'].search([['partner_id', '=', this.pyEnv.currentPartnerId], ['state', '!=', 'declined']]);
        return [
            '&',
                '|',
                    '&',
                        '|',
                            ['start', '>=', datetime_to_str(startDate)],
                            ['stop', '>=', datetime_to_str(startDate)],
                        ['start', '<=', datetime_to_str(endDate)],
                    '&',
                        ['allday', '=', true],
                        ['start_date', '=', datetime_to_str(startDate)],
                ['attendee_ids', 'in', currentPartnerAttendeeIds],
        ];
    },

    /**
     * Simulates `systray_get_activities` on `res.users`.
     *
     * @override
     */
    _mockResUsersSystrayGetActivities() {
        const activities = super._mockResUsersSystrayGetActivities(...arguments);
        const meetingsLines = this.pyEnv['calendar.event'].searchRead(
            this._mockResUsers_SystrayGetCalendarEventDomain(),
            {
                fields: ['id', 'start', 'name', 'allday'],
                order: 'start',
            }
        )
        if (meetingsLines.length) {
            activities.unshift({
                id: 'calendar.event', // for simplicity
                meetings: meetingsLines,
                model: 'calendar.event',
                name: 'Today\'s Meetings',
                type: 'meeting',
            });
        }
        return activities;
    },
});
