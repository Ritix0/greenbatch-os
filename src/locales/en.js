// Файл: src/locales/en.js
export const en = {
  common: {
    loading: 'Loading...',
    error: 'Error',
    back: 'Back',
    save: 'Save',
    cancel: 'Cancel',
    language_selector: 'Language / Язык',
    add: 'Add',
    delete: 'Delete',
    are_you_sure: 'Are you sure?',
    confirm: 'Confirm',
    select: 'Select',
    close: 'Close',
  },
  auth: {
    title: 'Log In / Sign Up', // Changed for clarity
    subtitle: 'Microgreens Operating System',
    email_label: 'Enter your Email',
    email_placeholder: 'farmer@example.com',
    login_btn: 'Log In / Create Account', // Button is now explicit
    sending: 'Sending...',
    success_message: 'Magic link sent! Check your email.',
    check_spam: 'Check Spam folder if not received.',
    error_desc: 'Login error'
  },
  dashboard: {
    welcome: '👋 Welcome',
    logout: 'Log out',
    user_label: 'Farmer',
    intro: 'Manage your crops list here.'
  },
  crops: {
    title: 'My Crops',
    add_button: 'Add New Crop',
    name_placeholder: 'Name (e.g. Peas)',
    days_blackout: 'Blackout Days',
    days_light: 'Light Days',
    seeds_weight: 'Seed Weight (g/tray)',
    empty: 'No crops yet. Add your first one!',
    delete: 'Delete',
    delete_confirm: 'Delete this crop?',
    saving: 'Saving...',
    stock_label: 'Stock:',
    refill_btn: 'Refill',
    refill_title: 'Add Stock',
    refill_placeholder: 'Amount added (g)',
    stock_low_warning: '⚠️ Low Stock!',
    stock_error: 'Not enough seeds! In stock: {current}g, needed: {needed}g.',
    delete_error_used: 'Cannot delete: crop is used in batches or orders.',
  },
  batches: {
    title: 'Active Batches',
    new_btn: 'Start New Batch',
    select_crop: 'Select Crop',
    tray_number: 'Tray Number / QR',
    start_date: 'Start Date',
    stage_blackout: '🌑 Blackout (Germination)',
    stage_light: '☀️ Light (Growing)',
    stage_ready: '✅ Ready to Harvest!',
    days_left: 'days left',
    days_total: 'day',
    harvest: 'Harvest',
    empty: 'Nothing growing. Start a batch!',
    finish_btn: 'Finish',
    finish_title: 'Batch Results',
    weight_placeholder: 'Harvest Weight (g)',
    notes_placeholder: 'Notes / Issues (e.g. Mold)',
    mark_harvested: '✅ Save as Harvest',
    mark_dumped: '🗑 Dump as Waste (0g)',
    tab_active: 'Active',
    tab_history: 'History',
    harvested_date: 'Harvested',
    yield: 'Yield',
    efficiency: 'Eff.',
    dumped: 'Dumped',
    confirm_harvest_title: 'Confirm Action',
    confirm_harvest_text: 'Record harvest weight of',
    confirm_dump_text: 'Dump this batch as WASTE (0g)?',
    confirm_warning: 'This action cannot be undone.',
    btn_yes_save: 'Yes, Save',
    btn_yes_dump: 'Yes, Dump',
    search_placeholder: '🔍 Search tray...',
    limit_reached_title: 'Free Plan Limit',
    limit_reached_desc: 'You reached the limit of 5 active batches. Harvest crops or upgrade to PRO.',
    active_count: 'Active: {current} / {max}',
    buy_pro: 'Get PRO',
    enter_key: 'Enter Activation Key',
    key_placeholder: 'Your access code',
    pro_activated: 'PRO activated! Thank you.',
    invalid_key: 'Invalid key',
  },
  orders: {
    title: 'Standing Orders',
    add_btn: 'Add Order',
    customer_placeholder: 'Customer (e.g. Mario)',
    trays_count: 'Trays',
    shipment_day: 'Shipment Day',
    plant_day: 'Planting Day',
    every: 'Every',
    week_days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    empty: 'No standing orders. Add one to automate planning.',
    plant_now: '⚡ Plant Now',
  },
  legal: {
    privacy_link: 'Privacy Policy',
    terms_link: 'Terms of Service',
    privacy_title: 'Privacy Policy',
    terms_title: 'Terms of Service',
    privacy_text: `1. Data Collection
We collect your email address solely for authentication.

2. Data Storage
Your data is stored securely using Supabase (PostgreSQL).

3. Support & Contact
For any questions, please contact us at: milligat13@gmail.com

4. Account Deletion
You can delete all your data instantly by using the "Delete Account" button at the bottom of the page.`,
    terms_text: `1. Acceptance of Terms
By using GreenBatch OS, you agree to these terms. The service is provided "as is" without warranties of any kind.

2. Usage
You are responsible for the data you enter. GreenBatch OS is a tool to assist with planning, but actual crop results depend on your farming conditions.

3. Limitations
We are not liable for any crop failures, financial losses, or missed orders resulting from the use of this software.

4. Changes
We reserve the right to modify these terms or the pricing model (for future PRO features) at any time.`,
  },
  profile: {
    delete_btn: 'Delete Account',
    delete_title: 'Delete Account',
    delete_desc: 'You are about to delete ALL your data (crops, batches, settings). This action cannot be undone.',
    delete_confirm_btn: 'Yes, Delete Everything',
    deleting: 'Deleting...',
  },
  landing: {
    hero_title: 'Manage Your Microgreens Farm Like a Pro',
    hero_desc: 'Stop the chaos of spreadsheets. Automate crop planning for restaurant orders.',
    features_title: 'Why Farmers Choose GreenBatch?',
    feat_1_title: '📅 Smart Scheduling',
    feat_1_desc: 'You set the order "5 trays of Peas for Friday", the system tells you exactly when to plant.',
    feat_2_title: '📉 Economics & Inventory',
    feat_2_desc: 'Auto-deduct seeds from stock. Track real biological efficiency per tray.',
    feat_3_title: '📱 Mobile First',
    feat_3_desc: 'Works perfectly on your phone with wet hands. No more soggy notebooks.',
    faq_title: 'FAQ',
    faq_1_q: 'Is it free?',
    faq_1_a: 'Yes, up to 5 active batches. Enough to test the full grow cycle.',
    faq_2_q: 'Do I need to print QR codes?',
    faq_2_a: 'No. You assign permanent numbers to trays (1-100). No printer hassle.',
    cta_footer: 'Start growing systematically today.',
  }
}