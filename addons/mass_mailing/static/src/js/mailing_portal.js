/** @odoo-module **/

import { escape } from "@web/core/utils/strings";
import { whenReady } from "@odoo/owl";
import { _t } from "@web/core/l10n/translation";
import { jsonrpc } from "@web/core/network/rpc_service";

whenReady(() => {
    var email = $("input[name='email']").val();
    var mailing_id = parseInt($("input[name='mailing_id']").val());
    var res_id = parseInt($("input[name='res_id']").val());
    var token = (location.search.split('token' + '=')[1] || '').split('&')[0];

    if ($('.o_unsubscribe_form').length) {
            if (email != '' && email != undefined){
                jsonrpc('/mailing/blacklist/check', {'email': email, 'mailing_id': mailing_id, 'res_id': res_id, 'token': token})
                    .then(function (result) {
                        if (result == 'unauthorized'){
                            $('#button_add_blacklist').hide();
                            $('#button_remove_blacklist').hide();
                        }
                        else if (result == true) {
                            $('#button_remove_blacklist').show();
                            toggle_opt_out_section(false);
                        }
                        else if (result == false) {
                            $('#button_add_blacklist').show();
                            toggle_opt_out_section(true);
                        }
                        else {
                            $('#subscription_info').text(_t('An error occurred. Please try again later or contact us.'));
                            $('#info_state').removeClass('alert-success').removeClass('alert-info').removeClass('alert-warning').addClass('alert-error');
                        }
                    })
                    .guardedCatch(function () {
                        $('#subscription_info').text(_t('An error occurred. Please try again later or contact us.'));
                        $('#info_state').removeClass('alert-success').removeClass('alert-info').removeClass('alert-warning').addClass('alert-error');
                    });
            }
            else {
                $('#div_blacklist').hide();
            }

            var unsubscribed_list = $("input[name='unsubscribed_list']").val();
            if (unsubscribed_list){
                $("#subscription_info").html(
                    _t(
                        "You have been <strong>successfully unsubscribed from %s</strong>.",
                        escape(unsubscribed_list)
                    )
                )
            }
            else{
                $('#subscription_info').html(_t('You have been <strong>successfully unsubscribed</strong>.'));
            }

        $('#unsubscribe_form').on('submit', function (e) {
            e.preventDefault();

            var checked_ids = [];
            $("input[type='checkbox']:checked").each(function (i){
                checked_ids[i] = parseInt($(this).val());
            });

            var unchecked_ids = [];
            $("input[type='checkbox']:not(:checked)").each(function (i){
                unchecked_ids[i] = parseInt($(this).val());
            });

            jsonrpc('/mailing/list/update', {'opt_in_ids': checked_ids, 'opt_out_ids': unchecked_ids, 'email': email, 'mailing_id': mailing_id, 'res_id': res_id, 'token': token})
                .then(function (result) {
                    if (result == 'unauthorized'){
                        $('#subscription_info').text(_t('You are not authorized to do this!'));
                        $('#info_state').removeClass('alert-success').removeClass('alert-info').removeClass('alert-error').addClass('alert-warning');
                    }
                    else if (result == true) {
                        $('#subscription_info').text(_t('Your changes have been saved.'));
                        $('#info_state').removeClass('alert-info').addClass('alert-success');
                    }
                    else {
                        $('#subscription_info').text(_t('An error occurred. Your changes have not been saved, try again later.'));
                        $('#info_state').removeClass('alert-info').addClass('alert-warning');
                    }
                })
                .guardedCatch(function () {
                    $('#subscription_info').text(_t('An error occurred. Your changes have not been saved, try again later.'));
                    $('#info_state').removeClass('alert-info').addClass('alert-warning');
                });
        });

        //  ==================
        //      Blacklist
        //  ==================
        $('#button_add_blacklist').click(function (e) {
            e.preventDefault();

            jsonrpc('/mailing/blacklist/add', {'email': email, 'mailing_id': mailing_id, 'res_id': res_id, 'token': token})
                .then(function (result) {
                    if (result == 'unauthorized'){
                        $('#subscription_info').text(_t('You are not authorized to do this!'));
                        $('#info_state').removeClass('alert-success').removeClass('alert-info').removeClass('alert-error').addClass('alert-warning');
                    }
                    else
                    {
                        if (result) {
                            $('#subscription_info').html(_t('You have been successfully <strong>added to our blacklist</strong>. '
                                   + 'You will not be contacted anymore by our services.'));
                            $('#info_state').removeClass('alert-warning').removeClass('alert-info').removeClass('alert-error').addClass('alert-success');
                            toggle_opt_out_section(false);
                        }
                        else {
                            $('#subscription_info').text(_t('An error occurred. Please try again later or contact us.'));
                            $('#info_state').removeClass('alert-success').removeClass('alert-info').removeClass('alert-warning').addClass('alert-error');
                        }
                        $('#button_add_blacklist').hide();
                        $('#button_remove_blacklist').show();
                        $('#unsubscribed_info').hide();
                    }
                })
                .guardedCatch(function () {
                    $('#subscription_info').text(_t('An error occurred. Please try again later or contact us.'));
                    $('#info_state').removeClass('alert-success').removeClass('alert-info').removeClass('alert-warning').addClass('alert-error');
                });
        });

        $('#button_remove_blacklist').click(function (e) {
            e.preventDefault();

            jsonrpc('/mailing/blacklist/remove', {'email': email, 'mailing_id': mailing_id, 'res_id': res_id, 'token': token})
                .then(function (result) {
                    if (result == 'unauthorized'){
                        $('#subscription_info').text(_t('You are not authorized to do this!'));
                        $('#info_state').removeClass('alert-success').removeClass('alert-info').removeClass('alert-error').addClass('alert-warning');
                    }
                    else
                    {
                        if (result) {
                            $('#subscription_info').html(_t("You have been successfully <strong>removed from our blacklist</strong>. "
                                    + "You are now able to be contacted by our services."));
                            $('#info_state').removeClass('alert-warning').removeClass('alert-info').removeClass('alert-error').addClass('alert-success');
                            toggle_opt_out_section(true);
                        }
                        else {
                            $('#subscription_info').text(_t('An error occurred. Please try again later or contact us.'));
                            $('#info_state').removeClass('alert-success').removeClass('alert-info').removeClass('alert-warning').addClass('alert-error');
                        }
                        $('#button_add_blacklist').show();
                        $('#button_remove_blacklist').hide();
                        $('#unsubscribed_info').hide();
                    }
                })
                .guardedCatch(function () {
                    $('#subscription_info').text(_t('An error occurred. Please try again later or contact us.'));
                    $('#info_state').removeClass('alert-success').removeClass('alert-info').removeClass('alert-warning').addClass('alert-error');
                });
        });

        // ==================
        //      Feedback
        // ==================
        $('#button_feedback').click(function (e) {
            var feedback = $("textarea[name='opt_out_feedback']").val();
            e.preventDefault();
            jsonrpc('/mailing/feedback', {'mailing_id': mailing_id, 'res_id': res_id, 'email': email, 'feedback': feedback, 'token': token})
                .then(function (result) {
                    if (result == 'unauthorized'){
                        $('#subscription_info').text(_t('You are not authorized to do this!'));
                        $('#info_state').removeClass('alert-success').removeClass('alert-info').removeClass('alert-error').addClass('alert-warning');
                    }
                    else if (result == true){
                        $('#subscription_info').text(_t('Thank you! Your feedback has been sent successfully!'));
                        $('#info_state').removeClass('alert-warning').removeClass('alert-info').removeClass('alert-error').addClass('alert-success');
                        $("#div_feedback").hide();
                    }
                    else {
                        $('#subscription_info').text(_t('An error occurred. Please try again later or contact us.'));
                        $('#info_state').removeClass('alert-success').removeClass('alert-info').removeClass('alert-error').addClass('alert-warning');
                    }
                })
                .guardedCatch(function () {
                    $('#subscription_info').text(_t('An error occurred. Please try again later or contact us.'));
                    $('#info_state').removeClass('alert-info').removeClass('alert-success').removeClass('alert-error').addClass('alert-warning');
                });
        });
    }
});

function toggle_opt_out_section(value) {
    var result = !value;
    $("#div_opt_out").find('*').attr('disabled',result);
    $("#button_add_blacklist").attr('disabled', false);
    $("#button_remove_blacklist").attr('disabled', false);
    if (value) { $('[name="button_subscription"]').addClass('clickable');  }
    else { $('[name="button_subscription"]').removeClass('clickable'); }
}
