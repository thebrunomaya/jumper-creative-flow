# Windsor.ai - Facebook Ads Connector Reference

> **Source**: Windsor.ai Facebook Ads Connector
> **Platforms**: Facebook Ads, Instagram Ads

## Overview

The Facebook connector pulls data from Facebook and Instagram Ads on a campaign, adset, ad and creative level.

### Sample Query URL

```
https://connectors.windsor.ai/facebook?=[API_KEY]&date_preset=last_7d&fields=campaign,date,clicks,spend,account_id&select_accounts
```

The Facebook Ads connector also supports custom conversions.

---

## Available Options

| ID | Type | Name | Description | Options |
|----|------|------|-------------|---------|
| `attribution_window` | SELECT_MULTI | Attribution Window | The attribution window for the actions. For example, 28d_click means the API returns all actions that happened 28 days after someone clicked on the ad. The 'default' option means ["7d_view","1d_click"]. Relates to action_attribution_windows parameter in Facebook Insights API. | 1d_view, 7d_view, 28d_view, 1d_click, 7d_click, 28d_click, 1d_ev, dda, default, 1d_view_first_conversion, 7d_view_first_conversion, 28d_view_first_conversion, 1d_view_all_conversions, 7d_view_all_conversions, 28d_view_all_conversions, 1d_click_first_conversion, 7d_click_first_conversion, 28d_click_first_conversion, 1d_click_all_conversions, 7d_click_all_conversions, 28d_click_all_conversions, skan_view, skan_click, incrementality, incrementality_all_conversions, incrementality_first_conversion |
| `use_unified_attribution_setting` | CHECKBOX | Use Unified Attribution Setting | When this parameter is set to true, your ads results will be shown using unified attribution settings defined at ad set level and parameter use_account_attribution_setting will be ignored. | - |

---

## Fields Reference

### Account Fields

| ID | Type | Name | Description |
|----|------|------|-------------|
| `account_balance` | NUMERIC | Account Balance | Bill amount due for this Ad Account. |
| `account_currency` | TEXT | Account currency | Currency that is used by your ad account. (duplicate) |
| `account_id` | TEXT | Account ID | The ID number of your ad account, which groups your advertising activity. |
| `account_name` | TEXT | Account Name | The name of your ad account, which groups your advertising activity. |
| `account_status` | TEXT | Account Status | Status of the account. |
| `accountid` | TEXT | Account ID (Duplicate) | The ID number of your ad account. (duplicate) |
| `amount_spent` | NUMERIC | Account Amount Spent | Current amount spent by the account with respect to spend_cap. |
| `campaign_status` | TEXT | Campaign Status | The status of the campaign. |
| `currency` | TEXT | Currency | Currency that is used by your ad account. |
| `spend_cap` | NUMERIC | Account Spend Cap | The total amount that this account can spend. |

---

### Action Values

| ID | Type | Name | Description |
|----|------|------|-------------|
| `action_values_add_payment_info` | NUMERIC | Adds of Payment Info Conversion Value | The total value of adds of payment info tracked with the conversions objective. |
| `action_values_add_to_cart` | NUMERIC | Adds to Cart Conversion Value | The total value of adds to cart tracked with the conversions objective. |
| `action_values_add_to_wishlist` | NUMERIC | Adds to Wishlist Conversion Value | The total value of adds to wishlist tracked with the conversions objective. |
| `action_values_app_custom_event_fb_mobile_add_to_cart` | NUMERIC | Action Values App Custom Event.Fb Mobile Add To Cart | - |
| `action_values_app_custom_event_fb_mobile_add_to_wishlist` | NUMERIC | Action Values App Custom Event.Fb Mobile Add To Wishlist | - |
| `action_values_app_custom_event_fb_mobile_content_view` | NUMERIC | Action Values App Custom Event.Fb Mobile Content View | - |
| `action_values_app_custom_event_fb_mobile_initiated_checkout` | NUMERIC | Action Values App Custom Event.Fb Mobile Initiated Checkout | - |
| `action_values_app_custom_event_fb_mobile_purchase` | NUMERIC | Action Values App Custom Event.Fb Mobile Purchase | - |
| `action_values_app_custom_event_other` | NUMERIC | Action Values App Custom Event.Other | - |
| `action_values_click_to_call_call_confirm` | NUMERIC | Call Confirmation Clicks Conversion Value | The total value of call confirmation clicks conversions. |
| `action_values_complete_registration` | NUMERIC | Registrations Completed Conversion Value | The total value of registrations completed tracked with the conversions objective. |
| `action_values_initiate_checkout` | NUMERIC | Checkouts Initiated Conversion Value | The total value of checkouts initiated tracked with the conversions objective. |
| `action_values_lead` | NUMERIC | Leads Conversion Value | The total value of leads tracked with the conversions objective. |
| `action_values_offsite_conversion_fb_pixel_add_payment_info` | NUMERIC | Website Adds of Payment Info Conversion Value | The total value of website adds of payment info conversions. |
| `action_values_offsite_conversion_fb_pixel_add_to_cart` | NUMERIC | Website Adds to Cart Conversion Value | The total value of website add to cart conversions. |
| `action_values_offsite_conversion_fb_pixel_add_to_wishlist` | NUMERIC | Website Adds to Wishlist Conversion Value | The total value of all website add to wishlist conversions. |
| `action_values_offsite_conversion_fb_pixel_complete_registration` | NUMERIC | Website Registrations Completed Conversion Value | The value of complete registration events tracked by the pixel on your website. |
| `action_values_offsite_conversion_fb_pixel_custom` | NUMERIC | Action Values Offsite Conversion Fb Pixel Custom | Custom pixel events defined by the advertiser |
| `action_values_offsite_conversion_fb_pixel_initiate_checkout` | NUMERIC | Website Checkouts Initiated Conversion Value | The total value of website checkout initiated conversions. |
| `action_values_offsite_conversion_fb_pixel_lead` | NUMERIC | Website Leads Conversion Value | The total value of website leads conversions. |
| `action_values_offsite_conversion_fb_pixel_purchase` | NUMERIC | Website Purchases Conversion Value | The total value of website purchase conversions. |
| `action_values_offsite_conversion_fb_pixel_search` | NUMERIC | Website Searches Conversion Value | The total value of website searches conversions. |
| `action_values_offsite_conversion_fb_pixel_view_content` | NUMERIC | Website Content Views Conversion Value | The total value of website content views conversions. |
| `action_values_omni_add_to_cart` | NUMERIC | Omni Adds to Cart Conversion Value | The total value of omni adds to cart tracked with the conversions objective. |
| `action_values_omni_complete_registration` | NUMERIC | Omni Registrations Completed Conversion Value | The total value of registrations completed tracked with the conversions objective. |
| `action_values_omni_custom` | NUMERIC | Action Values Omni Custom | - |
| `action_values_omni_initiated_checkout` | NUMERIC | Omni Checkouts Initiated Conversion Value | The total value of checkouts initiated tracked with the conversions objective. |
| `action_values_omni_purchase` | NUMERIC | Purchases Conversion Value | The total value of purchases tracked with the conversions objective. |
| `action_values_omni_search` | NUMERIC | Omni Searches Conversion Value | The total value of search conversions. |
| `action_values_omni_spend_credits` | NUMERIC | Credit Spends Conversion Value | The total value of spend credits conversions. |
| `action_values_omni_view_content` | NUMERIC | Content Views Conversion Value | The total value of content views tracked with the conversions objective. |
| `action_values_onsite_conversion_lead_grouped` | NUMERIC | On-Facebook Leads Conversion Value | The total value of on-facebook leads conversions. |
| `action_values_onsite_conversion_purchase` | NUMERIC | Action Values Onsite Conversion.Purchase | - |
| `action_values_onsite_web_add_to_cart` | NUMERIC | Action Values Onsite Web Add To Cart | - |
| `action_values_onsite_web_app_add_to_cart` | NUMERIC | Action Values Onsite Web App Add To Cart | - |
| `action_values_onsite_web_app_purchase` | NUMERIC | Action Values Onsite Web App Purchase | - |
| `action_values_onsite_web_purchase` | NUMERIC | Action Values Onsite Web Purchase | - |
| `action_values_purchase` | NUMERIC | Action Values Purchase | - |
| `action_values_search` | NUMERIC | Searches Conversion Value | The total value of search conversions. |
| `action_values_signup_event` | NUMERIC | Action Values Signup Event | - |
| `action_values_subscription_event` | NUMERIC | Action Values Subscription Event | - |
| `action_values_total` | NUMERIC | Action Values Total | Total values of actions |
| `actions_onsite_conversion_total_messaging_connection` | NUMERIC | Action Values Onsite Conversion Total Messaging Connection | - |

---

### Actions

| ID | Type | Name | Description |
|----|------|------|-------------|
| `actions_add_payment_info` | NUMERIC | Adds of Payment Info | The number of add payment info events attributed to your ads. |
| `actions_add_to_cart` | NUMERIC | Adds to Cart | The number of add to cart events attributed to your ads. |
| `actions_add_to_wishlist` | NUMERIC | Adds to Wishlist | The number of add to wishlist events attributed to your ads. |
| `actions_app_custom_event_fb_mobile_activate_app` | NUMERIC | Mobile App Activactions | The number of times your app was activated attributed to your ads. |
| `actions_app_custom_event_fb_mobile_add_payment_info` | NUMERIC | Actions App Custom Event.Fb Mobile Add Payment Info | - |
| `actions_app_custom_event_fb_mobile_add_to_cart` | NUMERIC | Actions App Custom Event.Fb Mobile Add To Cart | - |
| `actions_app_custom_event_fb_mobile_add_to_wishlist` | NUMERIC | Actions App Custom Event.Fb Mobile Add To Wishlist | - |
| `actions_app_custom_event_fb_mobile_complete_registration` | NUMERIC | Mobile App Registrations Completed | The number of registrations in your mobile app. |
| `actions_app_custom_event_fb_mobile_content_view` | NUMERIC | Mobile Content Views | The number of content views in your mobile app. |
| `actions_app_custom_event_fb_mobile_initiated_checkout` | NUMERIC | Actions App Custom Event.Fb Mobile Initiated Checkout | - |
| `actions_app_custom_event_fb_mobile_level_achieved` | NUMERIC | Mobile App Levels Completed | The number of levels achieved in your mobile app. |
| `actions_app_custom_event_fb_mobile_purchase` | NUMERIC | Actions App Custom Event.Fb Mobile Purchase | - |
| `actions_app_custom_event_fb_mobile_search` | NUMERIC | Actions App Custom Event.Fb Mobile Search | - |
| `actions_app_custom_event_fb_mobile_tutorial_completion` | NUMERIC | Actions App Custom Event.Fb Mobile Tutorial Completion | - |
| `actions_app_custom_event_other` | NUMERIC | Mobile App - Other | - |
| `actions_app_install` | NUMERIC | Desktop App Installs | The number of installs of your mobile app. |
| `actions_checkin` | NUMERIC | Check-Ins | The number of check-ins to your Facebook Page. |
| `actions_click_to_call_call_confirm` | NUMERIC | Call Confirmation Clicks | The number of call confirmation clicks attributed to your ads. |
| `actions_comment` | NUMERIC | Post Comments | The number of comments on your ads. |
| `actions_complete_registration` | NUMERIC | Registrations Completed | The number of complete registration events attributed to your ads. |
| `actions_initiate_checkout` | NUMERIC | Checkouts Initiated | The number of initiate checkout events attributed to your ads. |
| `actions_landing_page_view` | NUMERIC | Landing Page Views | The number of times a person clicked on an ad link and successfully loaded the destination webpage. |
| `actions_lead` | NUMERIC | Leads | The number of leads attributed to your ads. |
| `actions_like` | NUMERIC | Page Likes | The number of likes of your Facebook Page attributed to your ads. |
| `actions_link_click` | NUMERIC | Actions Link Clicks | The number of clicks on links within the ad. |
| `actions_mobile_app_install` | NUMERIC | Mobile App Installs | The number of installs of your mobile app. |
| `actions_offsite_conversion_fb_pixel_add_payment_info` | NUMERIC | Website Adds of Payment Info | The number of add payment info events tracked by the pixel. |
| `actions_offsite_conversion_fb_pixel_add_to_cart` | NUMERIC | Website Adds to Cart | The number of add to cart events tracked by the pixel. |
| `actions_offsite_conversion_fb_pixel_add_to_wishlist` | NUMERIC | Website Adds to Wishlist | The number of add to wishlist events tracked by the pixel. |
| `actions_offsite_conversion_fb_pixel_complete_registration` | NUMERIC | Website Registrations Completed | The number of complete registration events tracked by the pixel. |
| `actions_offsite_conversion_fb_pixel_custom` | NUMERIC | Custom Events | The number of custom events attributed to your ads. |
| `actions_offsite_conversion_fb_pixel_initiate_checkout` | NUMERIC | Website Checkouts Initiated | The number of initiate checkout events tracked by the pixel. |
| `actions_offsite_conversion_fb_pixel_lead` | NUMERIC | Website Leads | The number of lead events tracked by the pixel. |
| `actions_offsite_conversion_fb_pixel_purchase` | NUMERIC | Website Purchases | The number of purchase events tracked by the pixel. |
| `actions_offsite_conversion_fb_pixel_search` | NUMERIC | Website Searches | The number of search events tracked by the pixel. |
| `actions_offsite_conversion_fb_pixel_view_content` | NUMERIC | Website Content Views | The number of view content events tracked by the pixel. |
| `actions_omni_achievement_unlocked` | NUMERIC | Achievements Unlocked | The number of unlock achievement events attributed to your ads. |
| `actions_omni_activate_app` | NUMERIC | App Activations | The number of times your app was activated attributed to your ads. |
| `actions_omni_add_to_cart` | NUMERIC | Omni Adds to Cart | The number of add to cart omni events attributed to your ads. |
| `actions_omni_app_install` | NUMERIC | App Installs | The number of app installs that were recorded as app events. |
| `actions_omni_complete_registration` | NUMERIC | Omni Registrations Completed | The number of complete registration events attributed to your ads. |
| `actions_omni_custom` | NUMERIC | Actions Omni Custom | - |
| `actions_omni_initiated_checkout` | NUMERIC | Omni checkouts Initiated | The number of initiate checkout events attributed to your ads. |
| `actions_omni_level_achieved` | NUMERIC | Omni Levels Achieved | The number of achieve level events attributed to your ads. |
| `actions_omni_purchase` | NUMERIC | Omni Purchases | The number of purchase events attributed to your ads. |
| `actions_omni_rate` | NUMERIC | Ratings Submitted | The number of ratings submitted events attributed to your ads. |
| `actions_omni_search` | NUMERIC | Omni Searches | The number of search events attributed to your ads. |
| `actions_omni_spend_credits` | NUMERIC | Credit Spends | The number of spend credits events attributed to your ads. |
| `actions_omni_tutorial_completion` | NUMERIC | Omni Tutorials Completed | The number of completed tutorial events attributed to your ads. |
| `actions_omni_view_content` | NUMERIC | Omni Content Views | The number of view content events attributed to your ads. |
| `actions_onsite_conversion_flow_complete` | NUMERIC | On-Facebook Workflow Completions | The number of times a workflow was completed within Facebook. |
| `actions_onsite_conversion_lead_grouped` | NUMERIC | On-Facebook Leads | The number of leads submitted on Facebook-owned property. |
| `actions_onsite_conversion_messaging_block` | NUMERIC | Blocked Messaging Connections | The number of times people blocked a messaging connection. |
| `actions_onsite_conversion_messaging_conversation_started_7d` | NUMERIC | Messaging conversation started | The number of times a messaging conversation was started. |
| `actions_onsite_conversion_messaging_first_reply` | NUMERIC | Action Onsite Conversion Messaging First Reply | - |
| `actions_onsite_conversion_post_save` | NUMERIC | Post Saves | The total number of times your ad has been saved. |
| `actions_onsite_conversion_purchase` | NUMERIC | On-Facebook Purchases | The number of purchases made within Facebook. |
| `actions_onsite_web_add_to_cart` | NUMERIC | Actions Onsite Web Add To Cart | - |
| `actions_onsite_web_app_add_to_cart` | NUMERIC | Actions Onsite Web App Add To Cart | - |
| `actions_onsite_web_app_purchase` | NUMERIC | Actions Onsite Web App Purchase | - |
| `actions_onsite_web_purchase` | NUMERIC | Actions Onsite Web Purchase | - |
| `actions_page_engagement` | NUMERIC | Page Engagement | The total number of actions people took on your Facebook Page. |
| `actions_photo_view` | NUMERIC | Photo Views | The number of views of photos on your Page or posts. |
| `actions_post` | NUMERIC | Actions Post Shares | The number of shares of your ads. |
| `actions_post_engagement` | NUMERIC | Post Engagement | The total number of actions that people take involving your ads. |
| `actions_post_reaction` | NUMERIC | Post Reactions | The number of reactions on your ads. |
| `actions_purchase` | NUMERIC | Action Purchase | - |
| `actions_rsvp` | NUMERIC | Event Responses | The number of people who responded Interested or Going to your Facebook event. |
| `actions_search` | NUMERIC | Search Events | The number of search events attributed to your ads. |
| `actions_total` | NUMERIC | Total Actions | Total amount of actions attributed to your ads. |
| `actions_video_view` | NUMERIC | 3-Second Video Plays | The number of times your video played for at least 3 seconds. |
| `actions_view_content` | NUMERIC | Content Views | The number of view content events attributed to your ads. |

---

### Ad Fields

| ID | Type | Name | Description |
|----|------|------|-------------|
| `actor_id` | TEXT | Facebook Page ID | Used for Instagram Ads. Provide Instagram account ID used for running these ads. |
| `ad_created_time` | TIMESTAMP | Ad Created Time | Time when the ad was created. |
| `ad_format_asset` | TEXT | ID of ad format asset | The ID of the ad format asset involved in impression, click, or action. |
| `ad_id` | TEXT | Ad ID | Unique ID of the ad being viewed in reporting |
| `ad_name` | TEXT | Ad Name | The name of the ad being viewed in reporting |
| `ad_object_type` | TEXT | Ad Object Type | The type of Facebook object you want to advertise. |
| `adcontent` | TEXT | Ad Content | The name the ad set you're viewing in reporting. (duplicate) |
| `adgroupid` | TEXT | Ad Set ID (duplicate) | The unique ID of the ad set. (duplicate) |
| `adid` | TEXT | Ad ID (duplicate) | Unique ID of the ad being viewed in reporting (duplicate) |
| `adnetwork_conversions` | NUMERIC | (Deprecated) Ad Network Conversions | The Ad Network Reported Conversions. |
| `adnetwork_revenue` | NUMERIC | Ad Network Revenue | The Ad Network Reported Revenue |
| `adset_bid_amount` | NUMERIC | Ad Set Bid Amount | Bid cap or target cost for this ad set. |
| `adset_bid_info` | TEXT | Ad Set Bid Info | Map of bid objective to bid value. |
| `adset_bid_strategy` | TEXT | Ad Set Bid Strategy | Lowest cost is one of Facebook's bid strategy options. |
| `adset_budget_remaining` | NUMERIC | Ad Set Budget Remaining | Remaining budget of this Ad Set |
| `adset_created_time` | TIMESTAMP | Ad Set Created Time | Time when this Ad Set was created |
| `adset_daily_budget` | NUMERIC | Ad Set Daily Budget | The daily budget of the set. |
| `adset_destination_type` | TEXT | Ad Set Destination Type | Destination of ads in this Ad Set. |
| `adset_effective_status` | TEXT | Adset Effective Status | The effective status of the adset. |
| `adset_end_time` | TIMESTAMP | Ad Set End Time | End time, in UTC UNIX timestamp |
| `adset_id` | TEXT | Ad Set ID | The unique ID of the ad set. |
| `adset_lifetime_budget` | NUMERIC | Ad Set Lifetime Budget | The lifetime budget of the set. |
| `adset_name` | TEXT | Ad Set Name | The name the ad set you're viewing in reporting. |
| `adset_start_time` | TIMESTAMP | Ad Set Start Time | Start time, in UTC UNIX timestamp |
| `adset_status` | TEXT | Adset Status | The status of the adset. |
| `adset_updated_time` | TIMESTAMP | Ad Set Updated Time | Time when the Ad Set was updated |
| `adsset_optimization_goal` | TEXT | Ad Set Optimization Goal | The optimization goal this ad set is using. |
| `body` | TEXT | Body of the ad | The body of the ad. Not supported for video post creatives. |
| `body_asset` | TEXT | ID of body asset | The ID of the body asset involved in impression, click or action. |
| `clicks` | NUMERIC | Clicks | The number of clicks on your ads. |
| `creative_id` | TEXT | Creative ID | Unique ID for an ad creative |
| `effective_status` | TEXT | Effective Status | The effective status of the ad. |
| `estimated_ad_recall_rate` | PERCENT | Estimated Ad Recall Lift Rate | The rate at which people would remember seeing your ads. |
| `estimated_ad_recallers` | NUMERIC | Estimated Ad Recall Lift | An estimate of the number of additional people who may remember seeing your ads. |
| `keyword` | TEXT | Keyword | The name of the ad being viewed in reporting (duplicate) |
| `link` | TEXT | Ad Link (Destination URL) | The link where the user is taken to upon clicking on the ad. |
| `link_url` | TEXT | Ad Creative Link URL | URL for the internal destination for this ad creative. |
| `name` | TEXT | Ad Creative Name | Name of the link. |
| `object_type` | TEXT | Ad Creative Object Type | Object type for the ad creative. |
| `object_url` | TEXT | Ad Creative Object URL | Object URL for the ad creative. |
| `status` | TEXT | Ad Status | The status of the ad. |
| `template_url` | TEXT | Ad Creative Template URL | Tracking template URL for the ad creative. |
| `thumbnail_url` | IMAGE_URL | Ad Creative Thumbnail URL | Thumbnail image URL for the ad creative. |
| `title` | TEXT | Ad Creative Title | Title for link ad, which does not belong to a page. |
| `url_tags` | TEXT | Ad Creative URL Tags | A set of query string parameters (e.g. UTM tags). |
| `website_destination_url` | TEXT | Ad Website Destination URL | The link where the user is taken to upon clicking on the ad. |
| `website_purchase_roas_offsite_conversion_fb_pixel_purchase` | NUMERIC | Website Purchase ROAS | The total return on ad spend (ROAS) from website purchases. |

---

### Campaign Fields

| ID | Type | Name | Description |
|----|------|------|-------------|
| `buying_type` | TEXT | Buying Type | The method by which you pay for and target ads in your campaigns. |
| `campaign` | TEXT | Campaign | The campaign name of the ad campaign. |
| `campaign_bid_strategy` | TEXT | Campaign Bid Strategy | Bid strategy for this campaign. |
| `campaign_budget_remaining` | NUMERIC | Campaign Budget Remaining | Remaining campaign budget. |
| `campaign_buying_type` | TEXT | Campaign Buying Type | Buying type: AUCTION or RESERVED. |
| `campaign_configured_status` | TEXT | Campaign Configured Status | If PAUSED, all its active ad sets and ads will be paused. |
| `campaign_created_time` | TIMESTAMP | Campaign Created Time | Merging of start_times for the ad sets. |
| `campaign_daily_budget` | NUMERIC | Campaign Daily Budget | Daily budget of this campaign. |
| `campaign_effective_status` | TEXT | Campaign Effective Status | The effective status of the campaign. |
| `campaign_id` | TEXT | Campaign ID | The unique ID number of the ad campaign. |
| `campaign_lifetime_budget` | NUMERIC | Campaign Lifetime Budget | The lifetime budget of the campaign. |
| `campaign_objective` | TEXT | Campaign Objective | Campaign's objective. |
| `campaign_special_ad_category` | TEXT | Campaign Special Ad Category | HOUSING, EMPLOYMENT, CREDIT, or NONE. |
| `campaign_spend_cap` | NUMERIC | Campaign Spend Cap | A spend cap for the campaign. |
| `campaign_start_time` | TIMESTAMP | Campaign Start Time | Merging of start_times for the ad sets. |
| `campaign_stop_time` | TIMESTAMP | Campaign Stop Time | Merging of stop_times for the ad sets. |
| `campaignid` | TEXT | Campaign ID (duplicate) | The unique ID number of the ad campaign. (duplicate) |
| `objective` | TEXT | Objective | The objective reflecting the goal you want to achieve. |
| `spend` | NUMERIC | Amount Spent | The estimated total amount of money you've spent. |
| `totalcost` | NUMERIC | Total Cost | The estimated total amount of money you've spent. (duplicate) |

---

### Catalog Segment Actions

| ID | Type | Name | Description |
|----|------|------|-------------|
| `catalog_segment_actions_add_to_cart` | NUMERIC | Catalog Segment Actions Add To Cart | - |
| `catalog_segment_actions_app_custom_event_fb_mobile_add_to_cart` | NUMERIC | Catalog Segment Actions App Custom Event.FB Mobile Add To Cart | - |
| `catalog_segment_actions_app_custom_event_fb_mobile_content_view` | NUMERIC | Catalog Segment Actions App Custom Event.FB Mobile Content View | - |
| `catalog_segment_actions_app_custom_event_fb_mobile_purchase` | NUMERIC | Catalog Segment Actions App Custom Event.FB Mobile Purchase | - |
| `catalog_segment_actions_offsite_conversion_fb_pixel_add_to_cart` | NUMERIC | Catalog Segment Actions Offsite Conversion Fb Pixel Add To Cart | - |
| `catalog_segment_actions_offsite_conversion_fb_pixel_view_content` | NUMERIC | Catalog Segment Actions Offsite Conversion Fb Pixel View Content | - |
| `catalog_segment_actions_omni_add_to_cart` | NUMERIC | Catalog Segment Actions Omni Add To Cart | - |
| `catalog_segment_actions_omni_purchase` | NUMERIC | Catalog Segment Actions Omni Purchase | - |
| `catalog_segment_actions_omni_view_content` | NUMERIC | Catalog Segment Actions Omni View Content | - |
| `catalog_segment_actions_purchase` | NUMERIC | Catalog Segment Actions Purchase | - |
| `catalog_segment_actions_view_content` | NUMERIC | Catalog Segment Actions View Content | - |

---

### Catalog Segment Value

| ID | Type | Name | Description |
|----|------|------|-------------|
| `catalog_segment_value_add_to_cart` | NUMERIC | Catalog Segment Value Add To Cart | - |
| `catalog_segment_value_app_custom_event` | NUMERIC | Catalog Segment Value App Custom Event | - |
| `catalog_segment_value_app_custom_event_fb_mobile_add_to_cart` | NUMERIC | Catalog Segment Value App Custom Event.FB Mobile Add To Cart | - |
| `catalog_segment_value_app_custom_event_fb_mobile_content_view` | NUMERIC | Catalog Segment Value App Custom Event.FB Mobile Content View | - |
| `catalog_segment_value_app_custom_event_fb_mobile_purchase` | NUMERIC | Catalog Segment Value App Custom Event.FB Mobile Purchase | - |
| `catalog_segment_value_mobile_purchase_roas` | NUMERIC | Mobile purchase ROAS | Value from conversion events for the catalog segment. |
| `catalog_segment_value_offsite_conversion` | NUMERIC | Catalog Segment Value Offsite Conversion | - |
| `catalog_segment_value_offsite_conversion_fb_pixel_add_to_cart` | NUMERIC | Catalog Segment Value Offsite Conversion Fb Pixel Add To Cart | - |
| `catalog_segment_value_offsite_conversion_fb_pixel_view_content` | NUMERIC | Catalog Segment Value Offsite Conversion Fb Pixel View Content | - |
| `catalog_segment_value_omni_add_to_cart` | NUMERIC | Catalog Segment Value Omni Add To Cart | - |
| `catalog_segment_value_omni_purchase` | NUMERIC | Catalog Segment Value Omni Purchase | - |
| `catalog_segment_value_omni_purchase_roas` | NUMERIC | Total purchase ROAS | Total return on ad spend (ROAS) from purchases. |
| `catalog_segment_value_omni_view_content` | NUMERIC | Catalog Segment Value Omni View Content | - |
| `catalog_segment_value_onsite_app_add_to_cart` | NUMERIC | Catalog Segment Value Onsite App Add To Cart | - |
| `catalog_segment_value_onsite_app_purchase` | NUMERIC | Catalog Segment Value Onsite App Purchase | - |
| `catalog_segment_value_onsite_app_view_content` | NUMERIC | Catalog Segment Value Onsite App View Content | - |
| `catalog_segment_value_onsite_web_add_to_cart` | NUMERIC | Catalog Segment Value Onsite Web Add To Cart | - |
| `catalog_segment_value_onsite_web_app_add_to_cart` | NUMERIC | Catalog Segment Value Onsite Web App Add To Cart | - |
| `catalog_segment_value_onsite_web_app_purchase` | NUMERIC | Catalog Segment Value Onsite Web App Purchase | - |
| `catalog_segment_value_onsite_web_app_view_content` | NUMERIC | Catalog Segment Value Onsite Web App View Content | - |
| `catalog_segment_value_onsite_web_view_content` | NUMERIC | Catalog Segment Value Onsite Web View Content | - |
| `catalog_segment_value_purchase` | NUMERIC | Catalog Segment Value Purchase | - |
| `catalog_segment_value_view_content` | NUMERIC | Catalog Segment Value View Content | - |
| `catalog_segment_value_website_purchase_roas` | NUMERIC | Website purchase ROAS (Catalog Segment) | Total ROAS from website purchases of catalog items. |

---

### Clicks & Costs

| ID | Type | Name | Description |
|----|------|------|-------------|
| `cpc` | NUMERIC | CPC | The average cost for each click (all). |
| `cpm` | NUMERIC | CPM | The average cost for 1,000 impressions. |
| `cpp` | NUMERIC | Cost per 1,000 People Reached | The average cost to reach 1,000 people. |
| `ctr` | PERCENT | CTR | The percentage of times people saw your ad and performed a click. |
| `link_clicks` | NUMERIC | Link Clicks | The number of clicks on links within the ad. (duplicate) |
| `outbound_clicks_ctr_outbound_click` | PERCENT | Outbound CTR | The percentage of times people saw your ad and performed an outbound click. |
| `outbound_clicks_outbound_click` | NUMERIC | Outbound Clicks | The number of clicks on links that take people off Facebook. |
| `unique_clicks` | NUMERIC | Unique Clicks | The number of people who performed a click (all). |
| `unique_ctr` | PERCENT | Unique CTR | The percentage of people who saw your ad and performed a unique click. |
| `unique_link_clicks_ctr` | PERCENT | Unique Link Clicks CTR | The percentage of people who performed a link click. |
| `unique_outbound_clicks_ctr_outbound_click` | PERCENT | Unique Outbound CTR | The percentage of people who performed an outbound click. |
| `unique_outbound_clicks_outbound_click` | NUMERIC | Unique Outbound Clicks | The number of people who performed an outbound click. |
| `website_ctr_link_click` | PERCENT | Website CTR link click | The percentage of times people performed a link click. |

---

### Conversions

| ID | Type | Name | Description |
|----|------|------|-------------|
| `conversion_rate_ranking` | TEXT | Conversion Rate Ranking | How your ad's expected conversion rate compared to ads competing for the same audience. |
| `conversion_values_ad_click_mobile_app` | NUMERIC | In-App Ad Clicks Conversion Value | The value of mobile app ad clicks |
| `conversion_values_ad_impression_mobile_app` | NUMERIC | In-App Ad Impressions Conversion Value | The value of mobile app ad impressions |
| `conversion_values_cancel_subscription_mobile_app` | NUMERIC | Mobile App Canceled Subscriptions Conversion Value | The value of mobile app canceled subscriptions |
| `conversion_values_cancel_subscription_offline` | NUMERIC | Offline Canceled Subscriptions Conversion Value | The value of offline canceled subscriptions |
| `conversion_values_cancel_subscription_total` | NUMERIC | Canceled Subscriptions Conversion Value | The total value of canceled subscriptions |
| `conversion_values_cancel_subscription_website` | NUMERIC | Website Canceled Subscriptions Conversion Value | The value of website canceled subscriptions |
| `conversion_values_contact_mobile_app` | NUMERIC | Mobile App Contacts Conversion Value | The value of mobile app contacts |
| `conversion_values_contact_offline` | NUMERIC | Offline Contacts Conversion Value | The value of offline contacts |
| `conversion_values_contact_total` | NUMERIC | Contacts Conversion Value | The total value of contacts |
| `conversion_values_contact_website` | NUMERIC | Website Contacts Conversion Value | The value of website contacts |
| `conversion_values_customize_product_mobile_app` | NUMERIC | Mobile App Products Customized Conversion Value | The value of mobile app products customized |
| `conversion_values_customize_product_offline` | NUMERIC | Offline Products Customized Conversion Value | The value of offline products customized |
| `conversion_values_customize_product_total` | NUMERIC | Products Customized Conversion Value | The total value of products customized |
| `conversion_values_customize_product_website` | NUMERIC | Website Products Customized Conversion Value | The value of website products customized |
| `conversion_values_donate_mobile_app` | NUMERIC | Mobile App Donations Conversion Value | The value of mobile app donations |
| `conversion_values_donate_offline` | NUMERIC | Offline Donations Conversion Value | The value of offline donations |
| `conversion_values_donate_on_facebook` | NUMERIC | On Facebook Donations Conversion Value | The value of donations on facebook |
| `conversion_values_donate_total` | NUMERIC | Donations Conversion Value | The total value of donations |
| `conversion_values_donate_website` | NUMERIC | Website Donations Conversion Value | The value of website donations |
| `conversion_values_find_location_mobile_app` | NUMERIC | Mobile App Location Searches Conversion Value | The value of mobile app location searches |
| `conversion_values_find_location_offline` | NUMERIC | Offline Location Searches Conversion Value | The value of offline app location searches |
| `conversion_values_find_location_total` | NUMERIC | Location Searches Conversion Value | The total value of location searches |
| `conversion_values_find_location_website` | NUMERIC | Website Location Searches Conversion Value | The value of website location searches |
| `conversion_values_recurring_subscription_payment_mobile_app` | NUMERIC | Mobile App Recurring Subscription Payments Conversion Value | The value of mobile app recurring subscription payments |
| `conversion_values_recurring_subscription_payment_offline` | NUMERIC | Offline Recurring Subscription Payments Conversion Value | The value of offline recurring subscription payments |
| `conversion_values_recurring_subscription_payment_total` | NUMERIC | Recurring Subscription Payments Conversion Value | The total value of recurring subscription payments |
| `conversion_values_recurring_subscription_payment_website` | NUMERIC | Website Recurring Subscription Payments Conversion Value | The value of website recurring subscription payments |
| `conversion_values_schedule_mobile_app` | NUMERIC | Mobile App Appointments Scheduled Conversion Value | The value of mobile app appointments scheduled |
| `conversion_values_schedule_offline` | NUMERIC | Offline Appointments Scheduled Conversion Value | The value of offline app appointments scheduled |
| `conversion_values_schedule_total` | NUMERIC | Appointments Scheduled Conversion Value | The total value of appointments scheduled |
| `conversion_values_schedule_website` | NUMERIC | Website Appointments Scheduled Conversion Value | The value of website appointments scheduled |
| `conversion_values_start_trial_mobile_app` | NUMERIC | Mobile App Trials Started Conversion Value | The value of mobile app trials started |
| `conversion_values_start_trial_offline` | NUMERIC | Offline Trials Started Conversion Value | The value of offline trials started |
| `conversion_values_start_trial_total` | NUMERIC | Trials Started Conversion Value | The total value of trials started |
| `conversion_values_start_trial_website` | NUMERIC | Website Trials Started Conversion Value | The value of website trials started |
| `conversion_values_submit_application_mobile_app` | NUMERIC | Mobile App Applications Submitted Conversion Value | The value of mobile app applications submitted |
| `conversion_values_submit_application_offline` | NUMERIC | Offline Applications Submitted Conversion Value | The value of offline applications submitted |
| `conversion_values_submit_application_on_facebook` | NUMERIC | On Facebook Applications Submitted Conversion Value | The value of applications submitted on facebook |
| `conversion_values_submit_application_total` | NUMERIC | Applications Submitted Conversion Value | The total value of applications submitted |
| `conversion_values_submit_application_website` | NUMERIC | Website Applications Submitted Conversion Value | The value of website applications submitted |
| `conversion_values_subscribe_mobile_app` | NUMERIC | Mobile App Subscriptions Conversion Value | The value of mobile app subscriptions |
| `conversion_values_subscribe_offline` | NUMERIC | Offline Subscriptions Conversion Value | The value of offline subscriptions |
| `conversion_values_subscribe_total` | NUMERIC | Subscriptions Conversion Value | The total value of subscriptions |
| `conversion_values_subscribe_website` | NUMERIC | Website Subscriptions Conversion Value | The value of website subscriptions |
| `conversions_ad_click_mobile_app` | NUMERIC | Mobile app ad click conversions | The number of mobile app ad clicks |
| `conversions_ad_impression_mobile_app` | NUMERIC | Mobile app ad impression conversions | The number of mobile app ad impressions |
| `conversions_cancel_subscription_mobile_app` | NUMERIC | Mobile app cancel subscription conversions | The number of mobile app canceled subscriptions |
| `conversions_cancel_subscription_offline` | NUMERIC | Offline cancel subscription conversions | The number of offline canceled subscriptions |
| `conversions_cancel_subscription_total` | NUMERIC | Cancel subscription conversions | The total number of canceled subscriptions |
| `conversions_cancel_subscription_website` | NUMERIC | Website cancel subscription conversions | The number of website canceled subscriptions |
| `conversions_contact_mobile_app` | NUMERIC | Mobile app contact conversions | The number of mobile app contacts |
| `conversions_contact_offline` | NUMERIC | Offline contact conversions | The number of offline contacts |
| `conversions_contact_total` | NUMERIC | Contact conversions | The total number of contacts |
| `conversions_contact_website` | NUMERIC | Website contact conversions | The number of website contacts |
| `conversions_customize_product_mobile_app` | NUMERIC | Mobile app customize product conversions | The number of mobile app products customized |
| `conversions_customize_product_offline` | NUMERIC | Offline customize product conversions | The number of offline products customized |
| `conversions_customize_product_total` | NUMERIC | Customize product conversions | The total number of products customized |
| `conversions_customize_product_website` | NUMERIC | Website customize product conversions | The number of website products customized |
| `conversions_donate_mobile_app` | NUMERIC | Mobile app donate conversions | The number of mobile app donations |
| `conversions_donate_offline` | NUMERIC | Offline donate conversions | The number of offline donations |
| `conversions_donate_on_facebook` | NUMERIC | Donate on facebook conversions | The number of donations on facebook |
| `conversions_donate_total` | NUMERIC | Donate conversions | The total number of donations |
| `conversions_donate_website` | NUMERIC | Website Donate Conversions | The number of website donations |
| `conversions_find_location_mobile_app` | NUMERIC | Mobile app find location conversions | The number of mobile app location searches |
| `conversions_find_location_offline` | NUMERIC | Offline find location conversions | The number of offline app location searches |
| `conversions_find_location_total` | NUMERIC | Find location conversions | The total number of location searches |
| `conversions_find_location_website` | NUMERIC | Website find location conversions | The number of website location searches |
| `conversions_recurring_subscription_payment_mobile_app` | NUMERIC | Mobile app recurring subscription payment conversions | The number of mobile app recurring subscription payments |
| `conversions_recurring_subscription_payment_offline` | NUMERIC | Offline recurring subscription payment conversions | The number of offline recurring subscription payments |
| `conversions_recurring_subscription_payment_total` | NUMERIC | Recurring subscription payment conversions | The total number of recurring subscription payments |
| `conversions_recurring_subscription_payment_website` | NUMERIC | Website recurring subscription payment conversions | The number of website recurring subscription payments |
| `conversions_schedule_mobile_app` | NUMERIC | Mobile app schedule conversions | The number of mobile app appointments scheduled |
| `conversions_schedule_offline` | NUMERIC | Offline schedule conversions | The number of offline app appointments scheduled |
| `conversions_schedule_total` | NUMERIC | Appointments Scheduled Conversions | The total number of appointments scheduled |
| `conversions_schedule_website` | NUMERIC | Website schedule conversions | The number of website appointments scheduled |
| `conversions_start_trial_mobile_app` | NUMERIC | Mobile app trials started conversions | The number of mobile app trials started |
| `conversions_start_trial_offline` | NUMERIC | Offline trials started conversions | The number of offline trials started |
| `conversions_start_trial_total` | NUMERIC | Start trial conversions | The total number of trials started |
| `conversions_start_trial_website` | NUMERIC | Website trials started conversions | The number of website trials started |
| `conversions_submit_application_mobile_app` | NUMERIC | Submitted applications (Mobile App) | The number of mobile app applications submitted |
| `conversions_submit_application_offline` | NUMERIC | Submitted applications (Offline) | The number of offline applications submitted |
| `conversions_submit_application_on_facebook` | NUMERIC | Submitted applications (Facebook) | The number of applications submitted on facebook |
| `conversions_submit_application_total` | NUMERIC | Submit application conversions | The total number of applications submitted |
| `conversions_submit_application_website` | NUMERIC | Submitted applications (Website) | The number of website applications submitted |
| `conversions_subscribe_mobile_app` | NUMERIC | Mobile app subscribe conversions | The number of mobile app subscriptions |
| `conversions_subscribe_offline` | NUMERIC | Offline subscribe conversions | The number of offline subscriptions |
| `conversions_subscribe_total` | NUMERIC | Subscribe conversions | The total number of subscriptions |
| `conversions_subscribe_website` | NUMERIC | Website subscribe conversions | The number of website subscriptions |

---

### Converted Product

| ID | Type | Name | Description |
|----|------|------|-------------|
| `converted_product_quantity_app_custom_event` | NUMERIC | Converted Product Quantity App Custom Event | - |
| `converted_product_quantity_app_custom_event_fb_mobile_add_to_cart` | NUMERIC | Converted Product Quantity App Custom Event.FB Mobile Add To Cart | - |
| `converted_product_quantity_app_custom_event_fb_mobile_content_view` | NUMERIC | Converted Product Quantity App Custom Event.FB Mobile Content View | - |
| `converted_product_quantity_app_custom_event_fb_mobile_purchase` | NUMERIC | Converted Product Quantity App Custom Event.FB Mobile Purchase | - |
| `converted_product_quantity_offsite_conversion` | NUMERIC | Converted Product Quantity Offsite Conversion | - |
| `converted_product_quantity_offsite_conversion_fb_pixel_view_content` | NUMERIC | Converted Product Quantity Offsite Conversion Fb Pixel View Content | - |
| `converted_product_quantity_omni_add_to_cart` | NUMERIC | Converted Product Quantity Omni Add To Cart | - |
| `converted_product_quantity_omni_purchase` | NUMERIC | Converted Product Quantity Omni Purchase | - |
| `converted_product_quantity_omni_view_content` | NUMERIC | Converted Product Quantity Omni View Content | - |
| `converted_product_value_app_custom_event` | NUMERIC | Converted Product Value App Custom Event | - |
| `converted_product_value_app_custom_event_fb_mobile_add_to_cart` | NUMERIC | Converted Product Value App Custom Event.FB Mobile Add To Cart | - |
| `converted_product_value_app_custom_event_fb_mobile_content_view` | NUMERIC | Converted Product Value App Custom Event.FB Mobile Content View | - |
| `converted_product_value_app_custom_event_fb_mobile_purchase` | NUMERIC | Converted Product Value App Custom Event.FB Mobile Purchase | - |
| `converted_product_value_offsite_conversion` | NUMERIC | Converted Product Value Offsite Conversion | - |
| `converted_product_value_offsite_conversion_fb_pixel_view_content` | NUMERIC | Converted Product Value Offsite Conversion Fb Pixel View Content | - |
| `converted_product_value_omni_add_to_cart` | NUMERIC | Converted Product Value Omni Add To Cart | - |
| `converted_product_value_omni_purchase` | NUMERIC | Converted Product Value Omni Purchase | - |
| `converted_product_value_omni_view_content` | NUMERIC | Converted Product Value Omni View Content | - |

---

### Cost Per Action

| ID | Type | Name | Description |
|----|------|------|-------------|
| `cost_per_action_type_add_payment_info` | NUMERIC | Cost per Adds of Payment Info | Cost per add payment info event. |
| `cost_per_action_type_add_to_cart` | NUMERIC | Cost per Adds to Cart | Cost per add to cart event. |
| `cost_per_action_type_add_to_wishlist` | NUMERIC | Cost per Adds to Wishlist | Cost per add to wishlist event. |
| `cost_per_action_type_app_custom_event_fb_mobile_activate_app` | NUMERIC | Cost per Mobile App Activactions | Cost per app activation. |
| `cost_per_action_type_checkin` | NUMERIC | Cost per Check-Ins | Cost per check-in. |
| `cost_per_action_type_click_to_call_call_confirm` | NUMERIC | Cost per Call Confirmation Clicks | Cost per call confirmation click. |
| `cost_per_action_type_comment` | NUMERIC | Cost per Post Comments | Cost per comment. |
| `cost_per_action_type_complete_registration` | NUMERIC | Cost per Registrations Completed | Cost per registration. |
| `cost_per_action_type_initiate_checkout` | NUMERIC | Cost per Checkouts Initiated | Cost per checkout initiation. |
| `cost_per_action_type_landing_page_view` | NUMERIC | Cost per Landing Page Views | Cost per landing page view. |
| `cost_per_action_type_lead` | NUMERIC | Cost per Leads | Cost per lead. |
| `cost_per_action_type_like` | NUMERIC | Cost per Page Likes | Cost per page like. |
| `cost_per_action_type_link_click` | NUMERIC | Cost per Link Clicks | Cost per link click. |
| `cost_per_action_type_mobile_app_install` | NUMERIC | Cost per Mobile App Installs | Cost per mobile app install. |
| `cost_per_action_type_offsite_conversion_fb_pixel_add_payment_info` | NUMERIC | Cost per Website Adds of Payment Info | Cost per website add payment info. |
| `cost_per_action_type_offsite_conversion_fb_pixel_add_to_cart` | NUMERIC | Cost per Website Adds to Cart | Cost per website add to cart. |
| `cost_per_action_type_offsite_conversion_fb_pixel_add_to_wishlist` | NUMERIC | Cost per Website Adds to Wishlist | Cost per website add to wishlist. |
| `cost_per_action_type_offsite_conversion_fb_pixel_complete_registration` | NUMERIC | Cost per Website Registrations Completed | Cost per website registration. |
| `cost_per_action_type_offsite_conversion_fb_pixel_custom` | NUMERIC | Cost per Custom Events | Cost per custom event. |
| `cost_per_action_type_offsite_conversion_fb_pixel_initiate_checkout` | NUMERIC | Cost per Website Checkouts Initiated | Cost per website checkout. |
| `cost_per_action_type_offsite_conversion_fb_pixel_lead` | NUMERIC | Cost per Website Leads | Cost per website lead. |
| `cost_per_action_type_offsite_conversion_fb_pixel_purchase` | NUMERIC | Cost per Website Purchases | Cost per website purchase. |
| `cost_per_action_type_offsite_conversion_fb_pixel_search` | NUMERIC | Cost per Website Searches | Cost per website search. |
| `cost_per_action_type_offsite_conversion_fb_pixel_view_content` | NUMERIC | Cost per Website Content Views | Cost per website content view. |
| `cost_per_action_type_omni_achievement_unlocked` | NUMERIC | Cost per Achievements Unlocked | Cost per achievement unlocked. |
| `cost_per_action_type_omni_activate_app` | NUMERIC | Cost per App Activations | Cost per app activation. |
| `cost_per_action_type_omni_add_to_cart` | NUMERIC | Omni Cost per Adds to Cart | Cost per omni add to cart. |
| `cost_per_action_type_omni_app_install` | NUMERIC | Cost per App Installs | Cost per app install. |
| `cost_per_action_type_omni_complete_registration` | NUMERIC | Omni Cost per Registrations Completed | Cost per omni registration. |
| `cost_per_action_type_omni_initiated_checkout` | NUMERIC | Omni Cost per Checkouts Initiated | Cost per omni checkout. |
| `cost_per_action_type_omni_level_achieved` | NUMERIC | Cost per Levels Achieved | Cost per level achieved. |
| `cost_per_action_type_omni_purchase` | NUMERIC | Cost per Purchases | Cost per purchase. |
| `cost_per_action_type_omni_rate` | NUMERIC | Cost per Ratings Submitted | Cost per rating. |
| `cost_per_action_type_omni_search` | NUMERIC | Omni Cost per Searches | Cost per omni search. |
| `cost_per_action_type_omni_spend_credits` | NUMERIC | Cost per Credit Spends | Cost per credit spend. |
| `cost_per_action_type_omni_tutorial_completion` | NUMERIC | Cost per Tutorials Completed | Cost per tutorial completed. |
| `cost_per_action_type_omni_view_content` | NUMERIC | Omni Cost per Content Views | Cost per omni content view. |
| `cost_per_action_type_onsite_conversion_flow_complete` | NUMERIC | Cost per On-Facebook Workflow Completions | Cost per workflow completion. |
| `cost_per_action_type_onsite_conversion_lead_grouped` | NUMERIC | Cost per On-Facebook Leads | Cost per on-Facebook lead. |
| `cost_per_action_type_onsite_conversion_messaging_block` | NUMERIC | Cost per Blocked Messaging Connections | Cost per blocked connection. |
| `cost_per_action_type_onsite_conversion_messaging_conversation_started_7d` | NUMERIC | Cost per New Messaging Connections | Cost per new messaging connection. |
| `cost_per_action_type_onsite_conversion_post_save` | NUMERIC | Cost per Post Saves | Cost per post save. |
| `cost_per_action_type_onsite_conversion_purchase` | NUMERIC | Cost per On-Facebook Purchases | Cost per on-Facebook purchase. |
| `cost_per_action_type_page_engagement` | NUMERIC | Cost per Page Engagement | Cost per page engagement. |
| `cost_per_action_type_photo_view` | NUMERIC | Cost per Photo Views | Cost per photo view. |
| `cost_per_action_type_post` | NUMERIC | Cost per Post Shares | Cost per post share. |
| `cost_per_action_type_post_engagement` | NUMERIC | Cost per Post Engagement | Cost per post engagement. |
| `cost_per_action_type_post_reaction` | NUMERIC | Cost per Post Reactions | Cost per post reaction. |
| `cost_per_action_type_rsvp` | NUMERIC | Cost per Event Responses | Cost per event response. |
| `cost_per_action_type_search` | NUMERIC | Cost per Searches | Cost per search. |
| `cost_per_action_type_video_view` | NUMERIC | Cost per 3-Second Video Plays | Cost per 3-second video play. |
| `cost_per_action_type_view_content` | NUMERIC | Cost per Content Views | Cost per content view. |
| `cost_per_estimated_ad_recallers` | NUMERIC | Cost per Estimated Ad Recall Lift | Cost per estimated ad recall lift. |
| `cost_per_outbound_click_outbound_click` | NUMERIC | Cost per Outbound Clicks | Cost per outbound click. |
| `cost_per_thruplay_video_view` | NUMERIC | Cost per ThruPlays | Cost per ThruPlay. |

---

### Cost Per Conversion

| ID | Type | Name | Description |
|----|------|------|-------------|
| `cost_per_conversion_ad_click_mobile_app` | NUMERIC | Cost per mobile app ad click conversion | - |
| `cost_per_conversion_ad_impression_mobile_app` | NUMERIC | Cost per mobile app ad impression conversion | - |
| `cost_per_conversion_cancel_subscription_mobile_app` | NUMERIC | Cost per mobile app cancel subscription conversion | - |
| `cost_per_conversion_cancel_subscription_offline` | NUMERIC | Cost per offline cancel subscription conversion | - |
| `cost_per_conversion_cancel_subscription_total` | NUMERIC | Cost per cancel subscription conversion | - |
| `cost_per_conversion_cancel_subscription_website` | NUMERIC | Cost per website cancel subscription conversion | - |
| `cost_per_conversion_contact_mobile_app` | NUMERIC | Cost per mobile app contact conversion | - |
| `cost_per_conversion_contact_offline` | NUMERIC | Cost per offline contact conversion | - |
| `cost_per_conversion_contact_total` | NUMERIC | Cost per contact conversion | - |
| `cost_per_conversion_contact_website` | NUMERIC | Cost per website contact conversion | - |
| `cost_per_conversion_customize_product_mobile_app` | NUMERIC | Cost per mobile app customize product conversion | - |
| `cost_per_conversion_customize_product_offline` | NUMERIC | Cost per offline customize product conversion | - |
| `cost_per_conversion_customize_product_total` | NUMERIC | Cost per customize product conversion | - |
| `cost_per_conversion_customize_product_website` | NUMERIC | Cost per website customize product conversion | - |
| `cost_per_conversion_donate_mobile_app` | NUMERIC | Cost per mobile app donate conversion | - |
| `cost_per_conversion_donate_offline` | NUMERIC | Cost per offline donate conversion | - |
| `cost_per_conversion_donate_on_facebook` | NUMERIC | Cost per donate on facebook conversion | - |
| `cost_per_conversion_donate_total` | NUMERIC | Cost per donate conversion | - |
| `cost_per_conversion_donate_website` | NUMERIC | Cost per website donate conversion | - |
| `cost_per_conversion_find_location_mobile_app` | NUMERIC | Cost per mobile app find location conversion | - |
| `cost_per_conversion_find_location_offline` | NUMERIC | Cost per offline find location conversion | - |
| `cost_per_conversion_find_location_total` | NUMERIC | Cost per find location conversion | - |
| `cost_per_conversion_find_location_website` | NUMERIC | Cost per website find location conversion | - |
| `cost_per_conversion_recurring_subscription_payment_mobile_app` | NUMERIC | Cost per mobile app recurring subscription payment conversion | - |
| `cost_per_conversion_recurring_subscription_payment_offline` | NUMERIC | Cost per offline recurring subscription payment conversion | - |
| `cost_per_conversion_recurring_subscription_payment_total` | NUMERIC | Cost per recurring subscription payment conversion | - |
| `cost_per_conversion_recurring_subscription_payment_website` | NUMERIC | Cost per website recurring subscription payment conversion | - |
| `cost_per_conversion_schedule_mobile_app` | NUMERIC | Cost per mobile app schedule conversion | - |
| `cost_per_conversion_schedule_offline` | NUMERIC | Cost per offline schedule conversion | - |
| `cost_per_conversion_schedule_total` | NUMERIC | Cost per schedule conversion | - |
| `cost_per_conversion_schedule_website` | NUMERIC | Cost per website schedule conversion | - |
| `cost_per_conversion_start_trial_mobile_app` | NUMERIC | Cost per mobile app trial started conversion | - |
| `cost_per_conversion_start_trial_offline` | NUMERIC | Cost per offline trial started conversion | - |
| `cost_per_conversion_start_trial_total` | NUMERIC | Cost per trial started conversion | - |
| `cost_per_conversion_start_trial_website` | NUMERIC | Cost per website trial started conversion | - |
| `cost_per_conversion_submit_application_mobile_app` | NUMERIC | Cost per mobile app submit application conversion | - |
| `cost_per_conversion_submit_application_offline` | NUMERIC | Cost per offline submit application conversion | - |
| `cost_per_conversion_submit_application_on_facebook` | NUMERIC | Cost per submit application on facebook conversion | - |
| `cost_per_conversion_submit_application_total` | NUMERIC | Cost per submit application conversion | - |
| `cost_per_conversion_submit_application_website` | NUMERIC | Cost per website submit application conversion | - |
| `cost_per_conversion_subscribe_mobile_app` | NUMERIC | Cost per mobile app subscribe conversion | - |
| `cost_per_conversion_subscribe_offline` | NUMERIC | Cost per offline subscribe conversion | - |
| `cost_per_conversion_subscribe_total` | NUMERIC | Cost per subscribe conversion | - |
| `cost_per_conversion_subscribe_website` | NUMERIC | Cost per website subscribe conversion | - |

---

### Cost Per Unique Action

| ID | Type | Name | Description |
|----|------|------|-------------|
| `cost_per_unique_action_click_to_call_call_confirm` | NUMERIC | Cost per Unique Call Confirmation Clicks | - |
| `cost_per_unique_action_type_add_payment_info` | NUMERIC | Cost per Unique Adds of Payment Info | - |
| `cost_per_unique_action_type_add_to_cart` | NUMERIC | Cost per Unique Actions Add To Cart | - |
| `cost_per_unique_action_type_add_to_wishlist` | NUMERIC | Cost per Unique Adds to Wishlist | - |
| `cost_per_unique_action_type_checkin` | NUMERIC | Cost per Unique Check-Ins | - |
| `cost_per_unique_action_type_comment` | NUMERIC | Cost per Unique Post Comments | - |
| `cost_per_unique_action_type_complete_registration` | NUMERIC | Cost per Unique Registrations Completed | - |
| `cost_per_unique_action_type_initiate_checkout` | NUMERIC | Cost per Unique Checkouts Initiated | - |
| `cost_per_unique_action_type_landing_page_view` | NUMERIC | Cost per Unique Landing Page Views | - |
| `cost_per_unique_action_type_lead` | NUMERIC | Cost per Unique Leads | - |
| `cost_per_unique_action_type_like` | NUMERIC | Cost per Unique Page Likes | - |
| `cost_per_unique_action_type_link_click` | NUMERIC | Cost per Unique Link Clicks | - |
| `cost_per_unique_action_type_mobile_app_install` | NUMERIC | Cost per Unique Mobile App Installs | - |
| `cost_per_unique_action_type_offsite_conversion` | NUMERIC | (Deprecated) Cost per Unique Website Conversions | - |
| `cost_per_unique_action_type_offsite_conversion_fb_pixel_add_payment_info` | NUMERIC | Cost per Unique Website Adds of Payment Info | - |
| `cost_per_unique_action_type_offsite_conversion_fb_pixel_add_to_cart` | NUMERIC | Cost per Unique Website Adds to Cart | - |
| `cost_per_unique_action_type_offsite_conversion_fb_pixel_add_to_wishlist` | NUMERIC | Cost per Unique Website Adds to Wishlist | - |
| `cost_per_unique_action_type_offsite_conversion_fb_pixel_complete_registration` | NUMERIC | Cost per Unique Website Registrations Completed | - |
| `cost_per_unique_action_type_offsite_conversion_fb_pixel_initiate_checkout` | NUMERIC | Cost per Unique Website Checkouts Initiated | - |
| `cost_per_unique_action_type_offsite_conversion_fb_pixel_lead` | NUMERIC | Cost per Unique Website Leads | - |
| `cost_per_unique_action_type_offsite_conversion_fb_pixel_purchase` | NUMERIC | Cost per Unique Website Purchases | - |
| `cost_per_unique_action_type_offsite_conversion_fb_pixel_search` | NUMERIC | Cost per Unique Website Searches | - |
| `cost_per_unique_action_type_offsite_conversion_fb_pixel_view_content` | NUMERIC | Cost per Unique Website Content Views | - |
| `cost_per_unique_action_type_omni_achievement_unlocked` | NUMERIC | Cost per Unique Achievements Unlocked | - |
| `cost_per_unique_action_type_omni_activate_app` | NUMERIC | Cost per Unique App Activations | - |
| `cost_per_unique_action_type_omni_add_to_cart` | NUMERIC | Cost per Unique Adds to Cart | - |
| `cost_per_unique_action_type_omni_app_install` | NUMERIC | Cost per Unique App Installs | - |
| `cost_per_unique_action_type_omni_complete_registration` | NUMERIC | Omni Cost per Unique Registrations Completed | - |
| `cost_per_unique_action_type_omni_initiated_checkout` | NUMERIC | Omni Cost per Unique Checkouts Initiated | - |
| `cost_per_unique_action_type_omni_level_achieved` | NUMERIC | Cost per Unique Levels Completed | - |
| `cost_per_unique_action_type_omni_purchase` | NUMERIC | Cost per Unique Purchases | - |
| `cost_per_unique_action_type_omni_rate` | NUMERIC | Cost per Unique Ratings Submitted | - |
| `cost_per_unique_action_type_omni_search` | NUMERIC | Cost per Unique Searches | - |
| `cost_per_unique_action_type_omni_spend_credits` | NUMERIC | Cost per Unique Credit Spends | - |
| `cost_per_unique_action_type_omni_tutorial_completion` | NUMERIC | Cost per Unique Tutorials Completed | - |
| `cost_per_unique_action_type_omni_view_content` | NUMERIC | Omni Cost per Unique Content Views | - |
| `cost_per_unique_action_type_onsite_conversion_flow_complete` | NUMERIC | Cost per Unique On-Facebook Workflow Completions | - |
| `cost_per_unique_action_type_onsite_conversion_lead_grouped` | NUMERIC | Cost per Unique On-Facebook Leads | - |
| `cost_per_unique_action_type_onsite_conversion_messaging_block` | NUMERIC | Cost per Unique Blocked Messaging Connections | - |
| `cost_per_unique_action_type_onsite_conversion_purchase` | NUMERIC | Cost per Unique On-Facebook Purchases | - |
| `cost_per_unique_action_type_page_engagement` | NUMERIC | Cost per Unique Page Engagement | - |
| `cost_per_unique_action_type_photo_view` | NUMERIC | Cost per Unique Photo Views | - |
| `cost_per_unique_action_type_post_engagement` | NUMERIC | Cost per Unique Post Engagement | - |
| `cost_per_unique_action_type_post_reaction` | NUMERIC | Cost per Unique Post Reactions | - |
| `cost_per_unique_action_type_rsvp` | NUMERIC | Cost per Unique Event Responses | - |
| `cost_per_unique_action_type_video_view` | NUMERIC | Cost per Unique 3-Second Continuous Video Plays | - |
| `cost_per_unique_action_type_view_content` | NUMERIC | Cost per Unique Content Views | - |
| `cost_per_unique_click` | NUMERIC | Cost per Unique Clicks | - |
| `cost_per_unique_outbound_click_outbound_click` | NUMERIC | Cost per Unique Outbound Clicks | - |

---

### Custom Conversions

| ID | Type | Name | Description |
|----|------|------|-------------|
| `custom_conversion_action_count` | NUMERIC | Custom conversion action count | The number of custom conversion actions |
| `custom_conversion_action_name` | TEXT | Custom conversion action name | The name of the custom conversion action |
| `custom_conversion_action_value` | NUMERIC | Custom conversion action value | The value of custom conversion actions |
| `custom_conversion_business_id` | TEXT | Custom Conversion Business ID | ID of the Business that owns the custom conversion |
| `custom_conversion_business_name` | TEXT | Custom Conversion Business Name | Name of the Business that owns the custom conversion |
| `custom_conversion_creation_time` | TIMESTAMP | Custom Conversion Creation Time | Time at which the conversion was created |
| `custom_conversion_custom_event_type` | TEXT | Custom Conversion Custom Event Type | The type of the conversion event, e.g. PURCHASE |
| `custom_conversion_data_sources` | TEXT | Custom Conversion Data Sources | Event sources of the custom conversion |
| `custom_conversion_default_conversion_value` | NUMERIC | Custom Conversion Default Conversion Value | When conversion is URL based, the default conversion value |
| `custom_conversion_description` | TEXT | Custom Conversion Description | Description of the custom conversion |
| `custom_conversion_event_source_type` | TEXT | Custom Conversion Event Source Type | Event source type (pixel, app, etc) |
| `custom_conversion_first_fired_time` | TIMESTAMP | Custom Conversion First Fired Time | Time at which the pixel was first fired |
| `custom_conversion_id` | TEXT | Custom Conversion ID | ID of the custom conversion |
| `custom_conversion_is_archived` | BOOLEAN | Custom Conversion Is Archived | Whether this conversion is archived |
| `custom_conversion_is_unavailable` | BOOLEAN | Custom Conversion Is Unavailable | Whether this conversion is unavailable |
| `custom_conversion_last_fired_time` | TIMESTAMP | Custom Conversion Last Fired Time | Time at which the pixel was last fired |
| `custom_conversion_name` | TEXT | Custom Conversion Name | Name of the custom conversion |
| `custom_conversion_pixel_id` | TEXT | Custom Conversion Pixel ID | Custom conversion Pixel ID |
| `custom_conversion_retention_days` | NUMERIC | Custom Conversion Pixel Retention Days | Retention period for advanced rule |
| `custom_conversion_rule` | TEXT | Custom Conversion Rule | Rule of the custom conversion |

---

### Dynamic Creative Ads

| ID | Type | Name | Description |
|----|------|------|-------------|
| `call_to_action_asset` | TEXT | ID of call to action asset | The ID of the call to action asset involved. |
| `description_asset` | TEXT | ID of description asset | The ID of the description asset involved. |
| `image_asset` | TEXT | ID of image asset | The ID of the image asset involved. |
| `image_url` | IMAGE_URL | Ad Image URL | A URL for the image for this creative. |
| `link_url_asset` | TEXT | ID of the URL asset | The ID of the URL asset involved. |
| `link_url_asset_website_url` | TEXT | Website URL of the URL asset | The website URL of the URL asset involved. |
| `promoted_post_full_picture` | IMAGE_URL | Promoted Post Full Picture | Full size picture from attachment |
| `title_asset` | TEXT | ID of the title asset | The ID of the title asset involved. |

---

### Effective Media (Instagram)

| ID | Type | Name | Description |
|----|------|------|-------------|
| `effective_instagram_media__alt_text` | TEXT | Instagram Post Media Image Text | Descriptive text for images, for accessibility. |
| `effective_instagram_media__boost_ads_list` | TEXT | Instagram Post Media Boost Ads List | Overview of all Instagram ad information associated with the organic media. |
| `effective_instagram_media__boost_eligibility_info` | TEXT | Instagram Post Media Boost Eligibility Info | Information about boosting eligibility. |
| `effective_instagram_media__caption` | TEXT | Instagram Post Media Caption | Caption. Excludes album children. |
| `effective_instagram_media__comments_count` | NUMERIC | Instagram Post Media Comments Count | Count of comments on the media. |
| `effective_instagram_media__id` | TEXT | Instagram Post Media Image Id | Descriptive text for images, for accessibility. |
| `effective_instagram_media__is_comment_enabled` | TEXT | Instagram Post Media Is Comment Enabled | Indicates if comments are enabled or disabled. |
| `effective_instagram_media__is_shared_to_feed` | TEXT | Instagram Post Media Is Shared To Feed | For Reels only. Whether reel appears in Feed and Reels tabs. |
| `effective_instagram_media__legacy_instagram_media_id` | TEXT | Instagram Post Media Legacy Instagram Media Id | Legacy ID for Instagram media. |
| `effective_instagram_media__like_count` | NUMERIC | Instagram Post Media Like Count | Count of likes on the media. |
| `effective_instagram_media__media_product_type` | TEXT | Instagram Post Media Product Type | Surface where the media is published. Can be AD, FEED, STORY or REELS. |
| `effective_instagram_media__media_type` | TEXT | Instagram Post Media Type | Media type. Can be CAROUSEL_ALBUM, IMAGE, or VIDEO. |
| `effective_instagram_media__media_url` | TEXT | Instagram Post Media URL | The URL for the media. |
| `effective_instagram_media__owner` | TEXT | Instagram Post Media Owner | Instagram user ID who created the media. |
| `effective_instagram_media__permalink` | TEXT | Instagram Post Media Permalink | Permanent URL to the media. |
| `effective_instagram_media__shortcode` | TEXT | Instagram Post Media Shortcode | Shortcode to the media. |
| `effective_instagram_media__thumbnail_url` | IMAGE_URL | Instagram Post Media Thumbnail Url | Media thumbnail URL. Only available on VIDEO media. |
| `effective_instagram_media__timestamp` | TIMESTAMP | Instagram Post Media Creation Date | ISO 8601-formatted creation date in UTC. |
| `effective_instagram_media__username` | TEXT | Instagram Post Media Creator Username | Username of user who created the media. |
| `effective_instagram_media_id` | TEXT | Instagram Post ID | The ID of an Instagram post to use in an ad. |
| `effective_instagram_story_id` | TEXT | Instagram Story ID | The ID of an Instagram post to display as an Instagram ad. |
| `effective_object_story_id` | TEXT | Facebook Post ID | The ID of a page post to use in an ad. |

---

### Impressions & Performance

| ID | Type | Name | Description |
|----|------|------|-------------|
| `canvas_avg_view_percent` | PERCENT | Instant Experience View Percentage | The average percentage of the Instant Experience that people saw. |
| `canvas_avg_view_time` | NUMERIC | Instant Experience View Time | The average total time, in seconds, that people spent viewing an Instant Experience. |
| `device_platform` | TEXT | Device platform | The type of device (mobile or desktop) used. |
| `engagement_rate_ranking` | TEXT | Engagement Rate Ranking | How your ad's expected engagement rate compared to ads competing for the same audience. |
| `frequency` | NUMERIC | Frequency | The average number of times each person saw your ad. |
| `frequency_value` | TEXT | (Currently not working) Number of frequency | (Deprecated) |
| `impression_device` | TEXT | Device (Impression) | The device where your last ad was served. |
| `impressions` | NUMERIC | Impressions | The number of times your ads were on screen. |
| `place_page_id` | TEXT | The ID of the place page | The ID of the place page involved. |
| `platform_position` | TEXT | Ad Placement | Where your ad was shown within a platform. |
| `publisher_platform` | TEXT | Ad Platform | Which platform your ad was shown. |
| `quality_ranking` | TEXT | Quality Ranking | How your ad's perceived quality compared to ads competing for the same audience. |
| `reach` | NUMERIC | Reach | The number of people who saw your ads at least once. |

---

### Location & Demographics

| ID | Type | Name | Description |
|----|------|------|-------------|
| `age` | TEXT | Age Range | The age range of the people you've reached. |
| `country` | COUNTRY | Country | The countries where the people you've reached are located. |
| `dma` | TEXT | Designated Market Area | DMA regions are the 210 geographic areas in the United States. |
| `gender` | TEXT | Gender | Gender of people you've reached. |
| `region` | REGION | Region | The regions where the people you've reached are located. |
| `user_segment` | TEXT | User Segment | User segment (new, existing) of Advantage+ Shopping Campaigns. |

---

### Preview URLs

| ID | Type | Name | Description |
|----|------|------|-------------|
| `desktop_feed_standard_preview_url` | TEXT | Desktop Feed Standard Preview URL | URL to a preview of the ad, as seen in desktop feed. |
| `facebook_permalink_url` | TEXT | Facebook Post URL | The URL to the Facebook post. |
| `facebook_story_mobile_preview_url` | TEXT | Facebook Story Mobile Preview URL | URL to a preview of the ad in facebook story mobile. |
| `instagram_permalink_url` | TEXT | Instagram Post URL | URL for a post on Instagram you want to run as an ad. |
| `instagram_standard_preview_url` | TEXT | Instagram Standard Preview URL | URL to a preview of the ad in instagram standard. |
| `instagram_story_preview_url` | TEXT | Instagram Story Preview URL | URL to a preview of the ad in instagram story. |
| `instant_article_standard_preview_url` | TEXT | Instant Article Standard Preview URL | URL to a preview of the ad in instant article. |
| `instream_video_desktop_preview_url` | TEXT | Instream Video Desktop Preview URL | URL to a preview of the ad in instream video desktop. |
| `instream_video_mobile_preview_url` | TEXT | Instream Video Mobile Preview URL | URL to a preview of the ad in instream video mobile. |
| `mobile_feed_basic_preview_url` | TEXT | Mobile Feed Basic Preview URL | URL to a preview of the ad in mobile feed basic. |
| `mobile_feed_standard_preview_url` | TEXT | Mobile Feed Standard Preview URL | URL to a preview of the ad in mobile feed standard. |

---

### Product Fields

| ID | Type | Name | Description |
|----|------|------|-------------|
| `product_id` | TEXT | The ID and name of the product | The ID and name of the product involved. |

---

### Source & Data

| ID | Type | Name | Description |
|----|------|------|-------------|
| `datasource` | TEXT | Data Source | The name of the Windsor connector returning the row |
| `instagram_actor_id` | TEXT | Instagram Page ID | Instagram account ID used for running these ads. |
| `source` | TEXT | Source | The name of the Windsor connector returning the row |
| `source_instagram_media_id` | TEXT | Instagram Source Media ID | Instagram Media ID of post for creative. |

---

### Time Fields

| ID | Type | Name | Description |
|----|------|------|-------------|
| `date` | DATE | Date | The dimension that determines how date-based data in a chart is handled. |
| `date_start` | DATE | Reporting Starts | The start date for your data. |
| `date_stop` | DATE | Reporting Ends | The end date for your data. |
| `day_of_month` | TEXT | Day of month | Day of the month |
| `hourly_stats_aggregated_by_advertiser_time_zone` | TEXT | Hourly delivery stats (advertiser time zone) | Hourly breakdown aggregated by advertiser's time zone. |
| `hourly_stats_aggregated_by_audience_time_zone` | TEXT | Hourly delivery stats (audience time zone) | Hourly breakdown aggregated by audience's time zone. |
| `month` | TEXT | Month | Number of the month |
| `today` | DATE | Today | Today's date |
| `week` | TEXT | Week | Week (Sun-Sat). |
| `week_day` | TEXT | Day of week and day number | Weekday number and name combined (Sun-Sat). |
| `week_day_iso` | TEXT | Day of week and day number, ISO | Weekday number and name combined, ISO format (Mon-Sun). |
| `week_iso` | TEXT | Week ISO | Week, ISO format (Mon-Sun). |
| `year` | TEXT | Year | Year |
| `year_month` | TEXT | Yearmonth | Year and month, e.g. 2024|3 |
| `year_of_week` | TEXT | Year of week | The year that contains first day of the week (Sun-Sat). |
| `year_of_week_iso` | TEXT | Year of week, ISO | The year that contains first day of the ISO week (Mon-Sun). |
| `year_week` | TEXT | Year week | Year and week for US weeks (Sun-Sat), e.g. 2024|15 |
| `year_week_iso` | TEXT | Year week ISO | Year and week for ISO weeks (Mon-Sun), e.g. 2024|20 |

---

### Unique Actions

| ID | Type | Name | Description |
|----|------|------|-------------|
| `unique_actions_add_payment_info` | NUMERIC | Unique Adds of Payment Info | The estimated number of people who submitted payment info. |
| `unique_actions_add_to_cart` | NUMERIC | Unique Actions Add To Cart | - |
| `unique_actions_add_to_wishlist` | NUMERIC | Unique Adds to Wishlist | The estimated number of people who added items to their wishlist. |
| `unique_actions_checkin` | NUMERIC | Unique Check-Ins | The number of people with check-ins to your Facebook Page. |
| `unique_actions_click_to_call_call_confirm` | NUMERIC | Unique Call Confirmation Clicks | - |
| `unique_actions_comment` | NUMERIC | Unique Post Comments | The number of people with comments on your ads. |
| `unique_actions_complete_registration` | NUMERIC | Unique Registrations Completed | The estimated number of people who registered. |
| `unique_actions_initiate_checkout` | NUMERIC | Unique Checkouts Initiated | The estimated number of people who initiated checkouts. |
| `unique_actions_landing_page_view` | NUMERIC | Unique Landing Page Views | The number of people who caused a landing page view. |
| `unique_actions_lead` | NUMERIC | Unique Leads | The number of people with leads attributed to your ads. |
| `unique_actions_like` | NUMERIC | Unique Page Likes | The number of people with likes of your Facebook Page. |
| `unique_actions_link_click` | NUMERIC | Unique Link Clicks | The number of people who performed a link click. |
| `unique_actions_mobile_app_install` | NUMERIC | Unique Mobile App Installs | The number of people with installs of your mobile app. |
| `unique_actions_offsite_conversion` | NUMERIC | (Deprecated) Unique Website Conversions | - |
| `unique_actions_offsite_conversion_fb_pixel_add_payment_info` | NUMERIC | Unique Website Adds of Payment Info | - |
| `unique_actions_offsite_conversion_fb_pixel_add_to_cart` | NUMERIC | Unique Website Adds to Cart | - |
| `unique_actions_offsite_conversion_fb_pixel_add_to_wishlist` | NUMERIC | Unique Website Adds to Wishlist | - |
| `unique_actions_offsite_conversion_fb_pixel_complete_registration` | NUMERIC | Unique Website Registrations Completed | - |
| `unique_actions_offsite_conversion_fb_pixel_initiate_checkout` | NUMERIC | Unique Website Checkouts Initiated | - |
| `unique_actions_offsite_conversion_fb_pixel_lead` | NUMERIC | Unique Website Leads | - |
| `unique_actions_offsite_conversion_fb_pixel_purchase` | NUMERIC | Unique Website Purchases | - |
| `unique_actions_offsite_conversion_fb_pixel_search` | NUMERIC | Unique Website Searches | - |
| `unique_actions_offsite_conversion_fb_pixel_view_content` | NUMERIC | Unique Website Content Views | - |
| `unique_actions_omni_achievement_unlocked` | NUMERIC | Unique Achievements Unlocked | - |
| `unique_actions_omni_activate_app` | NUMERIC | Unique App Activations | - |
| `unique_actions_omni_add_to_cart` | NUMERIC | Unique Adds to Cart | - |
| `unique_actions_omni_app_install` | NUMERIC | Unique App Installs | - |
| `unique_actions_omni_complete_registration` | NUMERIC | Omni Unique Registrations Completed | - |
| `unique_actions_omni_custom` | NUMERIC | Unique Actions Omni Custom | - |
| `unique_actions_omni_initiated_checkout` | NUMERIC | Unique Omni Checkouts Initiated | - |
| `unique_actions_omni_level_achieved` | NUMERIC | Unique Levels Completed | - |
| `unique_actions_omni_purchase` | NUMERIC | Omni Unique Purchases | - |
| `unique_actions_omni_rate` | NUMERIC | Unique Ratings Submitted | - |
| `unique_actions_omni_search` | NUMERIC | Unique Searches | - |
| `unique_actions_omni_spend_credits` | NUMERIC | Unique Credit Spends | - |
| `unique_actions_omni_tutorial_completion` | NUMERIC | Unique Tutorials Completed | - |
| `unique_actions_omni_view_content` | NUMERIC | Unique Omni Content Views | - |
| `unique_actions_onsite_conversion_flow_complete` | NUMERIC | Unique On-Facebook Workflow Completions | - |
| `unique_actions_onsite_conversion_lead_grouped` | NUMERIC | Unique On-Facebook Leads | - |
| `unique_actions_onsite_conversion_messaging_block` | NUMERIC | Unique Blocked Messaging Connections | - |
| `unique_actions_onsite_conversion_purchase` | NUMERIC | Unique On-Facebook Purchases | - |
| `unique_actions_page_engagement` | NUMERIC | Unique Page Engagement | - |
| `unique_actions_photo_view` | NUMERIC | Unique Photo Views | - |
| `unique_actions_post_engagement` | NUMERIC | Unique Post Engagement | - |
| `unique_actions_post_reaction` | NUMERIC | Unique Post Reactions | - |
| `unique_actions_purchase` | NUMERIC | Unique Actions Purchase | - |
| `unique_actions_rsvp` | NUMERIC | Unique Event Responses | - |
| `unique_actions_search` | NUMERIC | Unique Actions Search | - |
| `unique_actions_video_view` | NUMERIC | Unique 3-Second Continuous Video Plays | - |
| `unique_actions_view_content` | NUMERIC | Unique Content Views | - |

---

### Video Metrics

| ID | Type | Name | Description |
|----|------|------|-------------|
| `mobile_app_purchase_roas_app_custom_event_fb_mobile_purchase` | NUMERIC | Mobile App Purchase ROAS App Custom Event.Fb Mobile Purchase | - |
| `video_30_sec_watched_actions_video_view` | NUMERIC | Video 30 Sec Watched Actions | The number of times your video played for at least 30 seconds. |
| `video_avg_time_watched_actions_video_view` | NUMERIC | Video Average Play Time | The average time a video was played. |
| `video_continuous_2_sec_watched_actions_video_view` | NUMERIC | Video Watched for 2 seconds | The number of times your video was played for at least 2 continuous seconds. |
| `video_p100_watched_actions_video_view` | NUMERIC | Video Watched at 100 percent | The number of times your video was played at 100% of its length. |
| `video_p25_watched_actions_video_view` | NUMERIC | Video Watched at 25 percent | The number of times your video was played at 25% of its length. |
| `video_p50_watched_actions_video_view` | NUMERIC | Video Watched at 50 percent | The number of times your video was played at 50% of its length. |
| `video_p75_watched_actions_video_view` | NUMERIC | Video Watched at 75 percent | The number of times your video was played at 75% of its length. |
| `video_p95_watched_actions_video_view` | NUMERIC | Video Plays at 95 percent | The number of times your video was played at 95% of its length. |
| `video_play_actions_video_view` | NUMERIC | Video Plays | The number of times your video starts to play. |
| `video_thruplay_watched_actions_video_view` | NUMERIC | ThruPlay actions | The number of times your video was played to completion, or for at least 15 seconds. |
