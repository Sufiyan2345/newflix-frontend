// Copy for every page the footer links to, modelled on the real Netflix pages.
//
// Body text is authored in a small markdown subset so the SAME renderer serves
// both the defaults below and whatever an admin types into Admin → Site
// Settings → Static Pages (a plain-text entry still renders fine — every rule
// here is optional):
//
//   ## Heading        ### Sub-heading     - bullet item
//   > callout box     **bold**           *italic*
//   [label](/p/slug)  link
//   ---               horizontal rule
//
// `related` renders the real site's "Related Articles" card strip.

const FAQ_ITEMS = [
  {
    q: 'What is Netflix?',
    a: 'Netflix is a streaming service that offers a wide variety of award-winning TV shows, movies, anime, documentaries and more on thousands of internet-connected devices. You can watch as much as you want, whenever you want without a single commercial - all for one low monthly price. There is always something new to discover, and new TV shows and movies are added every week.',
  },
  {
    q: 'How much does Netflix cost?',
    a: 'Watch Netflix on your smartphone, tablet, Smart TV, laptop or streaming device, all for one fixed monthly fee. Plans range from Rs 250 to Rs 1,100/month. You can change your plan or cancel online at any time.',
  },
  {
    q: 'Where can I watch?',
    a: 'Watch anywhere, anytime. Sign in with your account to watch instantly on the web from your personal computer, or on any internet-connected device that offers the Netflix app, including smart TVs, smartphones, tablets, streaming media players and game consoles.',
  },
  {
    q: 'How do I cancel?',
    a: 'Netflix is flexible. You can easily cancel your account online in two clicks. There are no cancellation fees - start or stop your account at any time.',
  },
  {
    q: 'What can I watch on Netflix?',
    a: 'Netflix has an extensive library of feature films, documentaries, TV programmes, anime, award-winning originals and more. Watch as much as you want, anytime you want.',
  },
  {
    q: 'Is Netflix good for kids?',
    a: 'The Kids experience is included in your membership to give parents control whilst kids enjoy family-friendly TV programmes and films in their own space. Kids profiles come with PIN-protected parental controls that let you restrict the maturity rating of content kids can watch and block specific titles you do not want kids to see.',
  },
];

// The FAQ is generated from one array so the "Frequently Asked Questions"
// heading and the accordions can never drift apart.
const faqBody = FAQ_ITEMS
  .map(({ q, a }) => `### ${q}\n${a}`)
  .join('\n\n');

export const CONTENT = {
  faq: {
    title: 'Frequently Asked Questions',
    body: faqBody,
  },

  'what-is-netflix': {
    title: 'What is Netflix?',
    body: `Netflix is a subscription-based [streaming service](https://www.netflix.com) that allows our members to watch TV shows and movies on an internet-connected device. Depending on your plan, you can also [download TV shows and movies](/p/downloads) to your Android phone or tablet, iPhone, iPad, or Google Chromebook device and watch without an internet connection.

If you're already a member and would like to learn more about using Netflix, visit [Getting started with Netflix](/p/getting-started).

---

## TV Shows & Movies

Netflix content varies by region and may change over time. You can watch a variety of [award-winning originals, TV shows, movies, documentaries, and more](/p/ways-to-watch).

The more you watch, the better Netflix gets at [recommending TV shows and movies](/p/ways-to-watch).

---

## Supported Devices

You can watch Netflix through any [supported internet-connected device](/p/devices) that offers the Netflix app, including smart TVs, game consoles, streaming media players, cable boxes, smartphones, and tablets. You can also watch Netflix on your computer using an internet browser. To get the best performance, you can review the [system requirements](/p/devices) for your computer compatibility and check our [internet speed recommendations](/p/speed-test).

> **Note:** A small percentage of devices may not be supported by all plans.

Need help getting set up? Search our [Help Center](/p/help-center) for the manufacturer of the device you're using.

> **Note:** The Netflix app may come pre-loaded on certain devices, or you may need to download the Netflix app onto your device. Netflix app functionality may differ between devices.

---

## Plans and Pricing

Each [Netflix plan](/p/change-plan) determines the number of devices you can watch Netflix on [at the same time](/p/change-plan) and whether you can watch in High Definition (HD), Full High Definition (FHD), or Ultra High Definition (UHD).

You can [change your plan or cancel](/p/cancel-membership) online at any time.

---

## Get Started

To start watching Netflix:

1. Visit [netflix.com/signup](/signup).
2. [Choose a plan](/p/change-plan).
3. Create an account by entering your email address and creating a password.
4. Enter a [payment method](/p/billing-and-payments).

As a Netflix member, you are charged once a month on the date you signed up.`,
    related: [
      { label: 'Getting started with Netflix', to: '/p/getting-started' },
      { label: 'Billing and Payments', to: '/p/billing-and-payments' },
      { label: 'Netflix Gift Cards', href: 'https://help.netflix.com/en/node/32950' },
      { label: "Can't sign in to Netflix", to: '/p/sign-in-help' },
      { label: 'How to create, edit, or delete profiles', to: '/p/profiles' },
    ],
  },

  'help-center': {
    title: 'Help Center',
    // Rendered as a category grid, not prose.
    index: [
      {
        title: 'Getting Started',
        items: [
          { label: 'What is Netflix?', to: '/p/what-is-netflix' },
          { label: 'Getting started with Netflix', to: '/p/getting-started' },
          { label: 'How to create, edit, or delete profiles', to: '/p/profiles' },
        ],
      },
      {
        title: 'Billing and Payments',
        items: [
          { label: 'Billing and Payments', to: '/p/billing-and-payments' },
          { label: 'Change your plan', to: '/p/change-plan' },
          { label: 'Cancel your membership', to: '/p/cancel-membership' },
        ],
      },
      {
        title: 'Watching and Devices',
        items: [
          { label: 'Ways to Watch', to: '/p/ways-to-watch' },
          { label: 'Download shows and movies', to: '/p/downloads' },
          { label: 'Manage your devices', to: '/p/devices' },
        ],
      },
      {
        title: 'Account',
        items: [
          { label: "Can't sign in to Netflix", to: '/p/sign-in-help' },
          { label: 'Speed test', to: '/p/speed-test' },
          { label: 'Contact Us', to: '/p/contact' },
        ],
      },
    ],
  },

  'getting-started': {
    title: 'Getting started with Netflix',
    body: `New to Netflix? It takes about two minutes to start watching.

## 1. Create your account

Open the [sign-up page](/signup) and enter the email address and mobile number you want on the account, then choose a password. You can also finish signing up straight from the link we email you, which creates the account and takes you to the plan picker.

## 2. Choose a plan

Plans range from Rs 250 to Rs 1,100 per month. A higher plan lets you watch on more devices at the same time and unlocks HD, Full HD and Ultra HD. You can [change your plan](/p/change-plan) at any time.

## 3. Add a payment method

Enter a payment method. You are charged once a month on the date you signed up, and you can cancel online in two clicks whenever you like.

## 4. Create your profile

Every account has at least one profile, and you can add up to five. Give each person their own profile so recommendations, watch history and parental controls stay separate. See [how to manage profiles](/p/profiles).

## 5. Start watching

Pick something from **Home**, browse [New & Popular](/browse/new) for what just arrived, or open the [Kids](/kids) page for family-friendly viewing. Press Play on any title.`,
    related: [
      { label: 'What is Netflix?', to: '/p/what-is-netflix' },
      { label: 'Billing and Payments', to: '/p/billing-and-payments' },
      { label: 'How to create, edit, or delete profiles', to: '/p/profiles' },
    ],
  },

  // help.netflix.com/en/node/470. The reference does not write this as flat
  // prose: it opens with a line telling the reader to pick their situation, then
  // presents four COLLAPSIBLE option sections, and the fourth of those opens
  // into per-device collapsible groups. So the body is carried on `options` /
  // `groups` (each a small markdown chunk the same <Blocks> renderer draws)
  // rather than on `body`, which stays the fallback for an admin override.
  'sign-in-help': {
    title: "Can't sign in to Netflix",
    body: `If you're having trouble signing into your Netflix account, choose the option that best matches the issue you're having.`,
    options: [
      {
        title: 'Getting an error message when signing in',
        body: `If you get one of the error messages below, click the link and follow the steps in the matching article:

- [Netflix says 'Sorry, we can't find an account with this email address.'](https://help.netflix.com/en/node/124478)
- [Netflix says 'Sorry, something went wrong. Please try again later.'](https://help.netflix.com/en/node/122481)
- [Netflix says 'There was a problem signing in.'](https://help.netflix.com/en/node/66143)

If you get an Incorrect Password message or forget your password, you will need to [reset your password](https://www.netflix.com/loginhelp).

If you get a different error message or code, [search our Help Center](/p/help-center) to find a matching article.`,
      },
      {
        title: 'Having an issue with a sign-in code or link (one-time password)',
        body: `If you're having trouble signing in using a one-time password (OTP) or sign-in code/link that was sent to your email or phone number, [follow the steps in this article](https://help.netflix.com/en/node/529303577956964) to fix common issues.`,
      },
      {
        title: "Can't sign in on any device",
        body: `Try signing in to your Netflix account on a different device. If you can't sign in on any device, you might need to update your account. These articles might help:

- [Forgot email or phone number for Netflix](https://help.netflix.com/en/node/126425)
- [Forgot or need to change your Netflix password](https://help.netflix.com/en/node/365)
- [Netflix says to sign up when trying to sign in](https://help.netflix.com/en/node/59095)
- [Netflix account email was changed without permission](https://help.netflix.com/en/node/111934)

If you can sign in on one device but not another, go to the next option.`,
      },
      {
        title: 'Can sign in on one device, but not on another',
        body: `If you can sign in on one device, but not on a different one, there might be an issue with your device or home network. To fix the problem, follow the steps for your device.`,
        groups: [
          {
            title: 'TV or TV-connected device',
            body: `These steps will fix sign-in issues on smart TVs and devices that connect to a TV, including: streaming sticks, media players, cable boxes, Apple TV, and Xbox or PlayStation game consoles.

### Check your email, phone number and/or password

**Signing in with a code sent by email or text**

- Make sure the email shown on your TV is correct. If it isn't, click Previous to go back and fix it.
- Once it's fixed, you should receive an email or text (SMS) with the sign-in code.

**Signing in with a password**

- Enter your password again, keeping in mind that Netflix passwords are case-sensitive.
- Click the arrow on the screen to change between upper and lower-case letters.
- Click Show Password to see your password and make sure it's correct.

### Restart your device

- Turn off your device. If your device has a power cable, unplug it.
- Make sure your device is completely off, not just in sleep or standby mode.
- Leave your device off for 15 seconds.
- Turn on your device and try Netflix again.

### Reset your password

You might need to reset your password.

### Restart your home network

- Turn off your device, then unplug your modem and router from power.
- After 30 seconds, plug in your modem and router.
- Wait 1 minute, then turn on your device.
- Try Netflix again.

> Note: Some devices, modems, and routers might take longer to reconnect to the Internet.

### Restore your default connection settings

If you've changed the connection settings on your device, you'll need to change them back to default. These settings could include:

- Custom modem settings.
- Virtual Private Network (VPN) or proxy service settings.
- Custom DNS settings.

If you need help changing these settings, contact the device manufacturer. Once you've reset these settings, try Netflix again.

### Contact your internet service provider

If the steps don't fix the problem, contact your internet service provider (ISP) for help fixing a network connection issue. Your ISP can:

- Check for an internet outage in your area.
- Fix common router or modem issues and incorrect network settings.
- Restart or reset your network's connection.`,
          },
          {
            title: 'Web browser',
            body: `### Update your web browser

Go to [Netflix supported browsers](/p/devices) to update your web browser or get a different browser.

### Turn on cookies in your browser

**Chrome**

- In the upper right corner of Chrome, click Menu, then click Settings.
- On the left, click Privacy and security.
- Click Third-party cookies.
- Make sure the setting for Allow third-party cookies is turned on.
- Try Netflix again.

**Firefox**

- In the upper right, click Menu, then click Settings.
- On the left, click Privacy & Security.
- Scroll down to History. Next to Firefox will, click the drop-down menu.
- Choose Remember history, then click Restart Firefox now.
- Try Netflix again.

**Windows Edge**

- In the upper right corner of the browser, click Settings and more, then click Settings.
- Click Cookies and site permissions.
- Click Manage and delete cookies and site data.
- Make sure Allow sites to save and read cookie data (recommended) is turned on.

**Safari**

- In the top left corner of the browser, click Safari, then click Settings, then click Advanced.
- Make sure Block all cookies is unchecked.
- Close the window, then try Netflix again.

**Opera**

- Select Menu from the upper left corner of your browser.
- Select Settings.
- Scroll down until you see Cookies.
- Make sure the option Allow local data to be set (recommended) is selected.
- Close the Settings tab to save your new settings.
- Try Netflix again.

If you use the Netflix app for Windows, follow the steps for your computer.

### Update your saved password

If your browser or password manager is saving an out-of-date password, it will keep signing you in with the old one. Update it in your browser's saved-password settings, or in the password manager you use.

If you use a password manager to change your Netflix password, be sure to also update that password in the Netflix app by going to [netflix.com/loginhelp](https://www.netflix.com/loginhelp). It will not be updated automatically.

### Clear the Netflix cookie

Go to [netflix.com/clearcookies](https://www.netflix.com/clearcookies). This will sign you out of your account. Select Sign In and enter your Netflix email and password. Try Netflix again.

### Reset your password

You might need to reset your password.

### Reset the Netflix app for Windows 10

Resetting the app will sign you out of Netflix.

- Click the Start menu, then click the Settings button.
- Click Apps.
- Under Apps & features, scroll down and click Netflix > Advanced options.
- Under Reset, click the Reset button.
- Try Netflix again.

### Reset the Netflix app for Windows 11

Resetting the app will sign you out of Netflix.

- Click the Start menu, then click the Settings button.
- On the left, click Apps > Installed apps.
- Scroll down to find the Netflix app.
- Next to the Netflix app, click the Menu, then click Advanced options.
- Under Reset, click the Reset button.
- Try Netflix again.`,
          },
        ],
      },
    ],
    // The reference's own four, in its order. The three that have no page in
    // this build go to the live Help Center, as the other articles do for
    // off-site references.
    related: [
      { label: 'How to change or reset your password', href: 'https://www.netflix.com/loginhelp' },
      { label: 'Netflix-recommended internet speeds', to: '/p/speed-test' },
      { label: 'Getting started with Netflix', to: '/p/getting-started' },
      { label: 'How to keep your account secure', href: 'https://help.netflix.com/en/node/65674' },
    ],
  },

  // help.netflix.com/en/node/10421. Verbatim structure: an intro, the list of
  // what each profile stores, then six "## " sections. The per-device steps
  // ("TV or TV streaming device: ...", "Web browser: ...") are bulleted with a
  // bold lead-in, which renderBullet's own colon rule already bolds.
  profiles: {
    title: 'How to create, edit, or delete profiles',
    body: `People who live together in a single household can have their own personalized Netflix experience. You can have up to 5 profiles on a single Netflix account.

> Note: Profiles aren't available on devices made before 2013.

Each profile allows for its own:

- Personal and contact information (including profile name, game handle, and email address)
- Profile lock
- Language preference
- Maturity level and specific viewing restrictions
- Subtitle appearance
- Playback settings
- Notification settings
- Viewing activity log
- Game saves
- Personalized TV show and movie suggestions
- My List
- Ratings

> Note: Depending on your account and profile, personal and contact information may also include gender, first and last name, and phone number.

> Note: Some profile features aren't available for Kids profiles.

## Create a profile

Profiles can be added on devices made after 2013. Go to the Manage Profiles section on your device:

- TV or TV streaming device: Go to the profile selection screen and choose Add Profile +.
- Web browser: Go to your Manage Profiles page.
- Android phone or tablet, iPhone, or iPad: Open the Netflix app. In the lower right, tap My Netflix. At the top, tap the profile name. Tap Manage Profiles. Select Add Profile. Enter the main profile's PIN, if prompted.

Name the profile and choose a profile icon.

> Note: Profile icon options may vary by location and profile. To use the Netflix Kids experience, select Kids.

Select Continue or Save. The new profile should show on the list of profiles on your account.

If you can't create a profile from your device, visit netflix.com on a web browser and follow the steps above.

## Delete a profile

You can delete profiles on most devices. The main profile on your account can't be deleted. To delete a profile, either the profile you want to delete or the main profile must be active. Deleting a profile will delete the viewing history and game saves for that profile.

To delete a profile:

- TV or TV streaming device: Go to the profile selection screen.
- Web browser: Go to your Manage Profiles page.
- Android phone or tablet, iPhone, or iPad: Open the Netflix app. In the lower right, tap My Netflix. At the top, tap the profile name. Tap Manage Profiles. Choose the profile you want to delete and select the Edit icon. Select Delete Profile.

If you can't delete a profile from your device, visit Netflix.com on a web browser and follow the steps above.

## Edit a profile

You can customize profiles on most devices. Go to the Manage Profiles section on your device:

- TV or TV streaming device: Go to the profile selection screen.
- Web browser: Go to your Manage Profiles page.
- Android phone or tablet, iPhone, or iPad: Open the Netflix app. In the lower right, tap My Netflix. At the top, tap the profile name. Tap Manage Profiles. Choose the profile you want to change and select the Edit icon.

Select the information or setting you want to edit.

> Note: Changes to maturity rating cannot be made on a TV or streaming device.

If you can't edit a profile from your device, visit netflix.com on a web browser and follow the steps above.

## Use profile & parental controls

All profile users, except for those with the Netflix Kids experience, can access and edit parental controls and permissions for individual profiles.

To edit settings for an individual profile:

- Web browser: Using a browser, go to your Account page. Select Profiles, then choose a profile.
- Android phone or tablet, iPhone, or iPad: Open the Netflix app. In the lower right, tap My Netflix. At the top, tap the profile name. Tap Manage Profiles. Choose the profile you want to change and select the Edit icon.

Select the setting you want to edit for that profile. If prompted, verify your identity by entering a code sent to your email or mobile phone number, or by entering your Netflix account password.

> Note: Codes will be sent to the primary account email or phone number.

Save / Submit changes. For more information, see Parental Controls on Netflix.

## Add or update an email address

To change the email on your primary profile (the account email), see How to change your email address on Netflix. You can add a different email address to any secondary Adult profile for a personalized way to sign in to Netflix, and to receive recommendations and other communications tailored to your profile.

To add or change an email address for a secondary profile:

1. Go to the Account page in a browser. You may need to sign in if you aren't already.
2. Select Profiles, then choose your profile.
3. Select the profile name to edit personal and contact information.
4. Enter the desired email for the profile.
5. Select Add Email. You can select Change Email or Delete Email if you're updating an existing email.

## Create and manage game handles

See How to create, update and use game handles to learn more.`,
    // The reference's own five, in its order. The four that have no page in this
    // build go to the live Help Center, as the other articles do for off-site
    // references.
    related: [
      { label: 'How to keep your account secure', href: 'https://help.netflix.com/en/node/65674' },
      { label: 'How to hide titles from viewing history', href: 'https://help.netflix.com/en/node/65665' },
      { label: 'How to change the language on Netflix', href: 'https://help.netflix.com/en/node/7450' },
      { label: 'How to add, change or delete a phone number', href: 'https://help.netflix.com/en/node/65666' },
      { label: 'Find the PayPal Invoice ID or Billing ID', href: 'https://help.netflix.com/en/node/38447' },
    ],
  },

  // help.netflix.com/en/node/41049. This is NOT a flat list of options. It is
  // THREE sections, each opening with a 60x60 editorial icon and - for two of
  // them - one line of intro prose, and each owning its own BOXED disclosures.
  // The sub-topics ("Payment method was declined", "Price is higher than
  // expected") are SIBLINGS of their section, not children, so they are
  // `options` on their own section rather than nested `groups` like node/470's
  // device lists. Copy, links and list nesting are the reference's own, read off
  // the served node/41049 markup.
  'billing-and-payments': {
    title: 'Billing and Payments',
    sections: [
      {
        heading: 'Your Netflix service charges',
        icon: 'bullet_payment_netflixcharges_en.webp',
        intro: 'Your billing history, along with the price and applicable taxes for your subscription, can be found in the payment history on your account page.',
        options: [
          {
            title: 'View your plan and monthly cost',
            body: `You can see a list of your past charges on your [Payment History](https://www.netflix.com/BillingActivity) page. Depending on where you live, you can also see any [applicable taxes](https://help.netflix.com/node/50068) that were included.

You can [compare plans and pricing](https://help.netflix.com/en/node/24926) and [change your plan](https://netflix.com/changeplan) at any time.`,
          },
          {
            title: 'Understand your billing date',
            // The reference opens this panel with a screenshot before the prose,
            // then runs the three date caveats as a disc list whose items each
            // carry a 16px glyph instead of a text bullet. The "369" title slot
            // is the width the reference renders that screenshot at - the file
            // itself is 720px wide, so it must not be stretched to the panel.
            body: `![Reviewing Netflix subscription with calendar and receipt](/editorial_billing_date_en.webp "369")

As a member, you are automatically charged once a month on the date you signed up. Your Netflix subscription is charged at the beginning of your billing cycle and can take several days to appear on your account.

- ![](/icon-globe.png)Your billing date may be one day earlier or later due to time zone differences.
- ![](/icon-arrow-left-right.png)If the day of your billing date does not occur in every month (for example, the 31st), you will be billed on the last day of that month instead.
- ![](/icon-building-marketplace.png)If you pay for Netflix through a third party, your Netflix billing date may vary from your provider's billing date.`,
          },
          {
            title: 'Update your payment information',
            body: `Go to the [Manage payment info page](https://www.netflix.com/simplemember/managepaymentinfo) to add a payment method. Learn more by visiting [how to add or update a payment method](https://help.netflix.com/en/node/134233).

If you would like to change how you pay for Netflix, we have [several payment options](https://help.netflix.com/en/node/116380).`,
          },
          {
            title: 'Print your Netflix invoice',
            body: `Follow the steps to [print an invoice for Netflix charges](https://help.netflix.com/node/23551).`,
          },
        ],
      },
      {
        heading: 'Resolve payment issues',
        icon: 'bullet_payment_issues_en.webp',
        intro: 'If there is a problem with your payment method, here are some of the most common causes with suggestions to resolve the issue.',
        options: [
          {
            title: 'Payment method was declined',
            body: `If the bank or financial institution declined the charge:

- Check that your payment information such as postal code, security code, expiration date are correct. If not, go to the [Manage payment info page](https://www.netflix.com/simplemember/managepaymentinfo). You may need to sign in if you haven't already. You can also try a [different payment method](http://netflix.com/account/membership/payment-methods).
- If everything is correct, you can retry your payment.
- If you're still having trouble, make sure your payment method supports e-commerce transactions.`,
          },
          {
            title: 'Payment method is not accepted',
            body: `There are many options to pay for Netflix including credit or debit cards, and third parties. If one of our accepted payment methods is not working, please [contact us for help](https://help.netflix.com/contactus).`,
          },
          {
            title: 'Account canceled unexpectedly',
            body: `If you are billed through a third party or have a package that includes Netflix, your account could be canceled for a number of reasons.

- There is an issue with your payment.
    - Third-party: Sign in to your third-party account to resolve the payment issue, then rejoin Netflix. If you can't rejoin through the third party, you can rejoin on Netflix.com and add a [different payment method](http://netflix.com/account/membership/payment-methods).
    - Package: Sign in to your package account to resolve the payment issue, then relink your Netflix account. You paused or canceled a package that includes Netflix and there is no other payment method on file.
        - If your package is still active, then relink your Netflix account.
        - If you canceled your package, sign in to your Netflix account and add a [new payment method](https://www.netflix.com/account).`,
          },
        ],
      },

      {
        heading: 'Investigate unexpected charges',
        icon: 'bullet_payment_unexpectedcharges_en.webp',
        // The reference puts no intro line under this heading - it is followed
        // straight by the first disclosure.
        options: [
          {
            title: 'Price is higher than expected',
            // These three run-in leads are bold in the source, so they are marked
            // explicitly rather than left to the shared lead-in guess, which
            // would also mis-bold "Third-party:" and "Package:" above.
            body: `There are a few reasons you may be seeing a charge that is more than you expected.

- **Taxes** - Depending on where you live, you may be charged taxes in addition to your subscription price.
- **Fees** - In some countries, card companies may charge an extra fee for cross-border transactions. Some countries may change the currency to USD even though we charge in local currency.
- **Plan changes** - If you or someone in your household upgraded your Netflix plan, your bill will reflect the higher plan price. This includes special sign-up or upgrade offers for a limited time. Once the offer ends, you may be charged the higher plan price. Check the email or text you received when the offer started for the original details.`,
          },
          {
            title: 'Charged earlier than expected',
            body: `If your billing date is scheduled for a day that does not occur in a given month (such as the 31st), you'll be billed on the last day of that month instead.

If there is a price change or you change to a higher-priced plan, you could be charged earlier than expected.`,
          },
          {
            title: 'Multiple or unauthorized charges',
            body: `Netflix members are charged once a month on the date they signed up.

If you change to a higher-priced plan or purchase an extra member slot, you could see multiple charges that month.

If you are seeing multiple charges or charges that you believe to be unauthorized from Netflix, [follow these steps](https://help.netflix.com/en/node/1019).`,
          },
        ],
      },
    ],
    // The reference's own five, in its order. Netflix Gift Cards and the
    // restart/update articles have no page in this build and go off-site, as the
    // other articles already do for off-site references.
    related: [
      { label: 'Netflix Gift Cards', href: 'https://help.netflix.com/en/node/32950' },
      { label: 'Getting started with Netflix', to: '/p/getting-started' },
      { label: 'What is Netflix?', to: '/p/what-is-netflix' },
      { label: 'How to restart your Netflix membership', href: 'https://help.netflix.com/en/node/65438' },
      { label: 'How to update Netflix account information', href: 'https://help.netflix.com/en/node/65674' },
    ],
  },

  'change-plan': {
    title: 'Change your plan',
    body: `You can move up or down at any time - the change takes effect straight away.

1. Go to the [Account](/account) page.
2. Choose **Membership & Plan**.
3. Pick the new plan and confirm.

## Moving up

A new plan applies immediately and you are charged the new price from today. If you move up mid-cycle you still keep the plan you paid for until this billing period ends.

## Moving down

The lower plan starts at the end of your current billing period, so you keep what you paid for. If you stream on more devices than your new plan allows, you will be asked to sign out of the extra ones.`,
    related: [
      { label: 'Billing and Payments', to: '/p/billing-and-payments' },
      { label: 'Cancel your membership', to: '/p/cancel-membership' },
    ],
  },

  'cancel-membership': {
    title: 'Cancel your membership',
    body: `Netflix is flexible - you can cancel online in two clicks and there are no cancellation fees. Start or stop your account at any time.

## How to cancel

1. Go to the [Account](/account) page.
2. Choose **Cancel Membership**.
3. Confirm. Your access continues until the end of the period you have already paid for.

## What happens to your data

Your profiles, watch history and My List stay on the account so that if you come back everything is where you left it. Request permanent deletion through [Privacy](/p/privacy) if you would rather it was removed for good.`,
    related: [
      { label: 'Billing and Payments', to: '/p/billing-and-payments' },
      { label: 'Change your plan', to: '/p/change-plan' },
    ],
  },

  // The footer's "Ways to Watch" link. The real page is the Help Center article
  // "Netflix Supported Devices | Watch Netflix on your TV, phone, or computer"
  // (help.netflix.com/en/node/14361) - a two-column article: prose on the left,
  // a "Related Articles" card on the right. Every device link below points at the
  // same real Help Center article the reference uses, so nothing is a dead end.
  'ways-to-watch': {
    title: 'Netflix Supported Devices | Watch Netflix on your TV, phone, or computer',
    body: `You can watch Netflix on any supported smart TV, phone, tablet, streaming player, or game console that connects to the internet and offers the Netflix app, or at [netflix.com](https://www.netflix.com) using a computer.

## TVs and TV streaming devices

Many TVs, TV streaming devices, and media players come with the Netflix app included. To get started, use the links below to learn how to get Netflix on your device.

- [Amazon Fire TV/Stick](https://help.netflix.com/en/node/23934)
- [Apple TV](https://help.netflix.com/en/node/23887)
- [Chromecast](https://help.netflix.com/en/node/23924)
- [Hisense](https://help.netflix.com/en/node/23904)
- [LG](https://help.netflix.com/en/node/23879)
- [Panasonic](https://help.netflix.com/en/node/23877)
- [Philips](https://help.netflix.com/en/node/23880)
- [Roku TV/Stick](https://help.netflix.com/en/node/23886)
- [Samsung](https://help.netflix.com/en/node/23876)
- [Sharp](https://help.netflix.com/en/node/23882)
- [Sony](https://help.netflix.com/en/node/23878)
- [TCL](https://help.netflix.com/en/node/23928)
- [Vestel](https://help.netflix.com/en/node/23918)
- [Vizio](https://help.netflix.com/en/node/23881)
- [Toshiba or TVS REGZA TV](https://help.netflix.com/en/node/23883)

> **Note:** Netflix may no longer be available on some TVs and TV streaming devices made before 2015.

Not seeing your device? [Search for your device's name or manufacturer](https://help.netflix.com) in our Help Center for more information. To learn more about device support, [contact us](/p/contact) or the company that made your device.

## Mobile phones and tablets

You can watch Netflix on any supported mobile phone or tablet. To get started, use the links below to see specific requirements and learn how to get the Netflix app on your device.

- [Android phone or tablet](https://help.netflix.com/en/node/23939)
- [iPhone or iPad](https://help.netflix.com/en/node/23927)
- [Amazon Fire tablet](https://help.netflix.com/en/node/23932)
- [Windows tablet](https://help.netflix.com/node/23931)

## Computers

You can watch Netflix on Mac, Windows, or Chromebook computers. To get started, go to netflix.com using [a supported web browser](https://help.netflix.com/en/node/30081), or get the [Netflix app for Windows](https://help.netflix.com/node/23931).

> **Note:** For issues getting started, make sure your computer and browser meet [these system requirements](https://help.netflix.com/en/node/30081).

## Cable boxes

Many internet, cable, and pay TV providers include the Netflix app on their devices. To get started, [search the name of your provider](https://help.netflix.com/search) in our Help Center to check if Netflix is available on your device. To learn more about device support, [contact us](/p/contact) or the company that provided your device.

## Video game consoles and AR/VR devices

You can watch Netflix on these popular video game consoles and AR/VR devices. To get started, use the links below to learn how to get Netflix on your game console.

- [Sony PlayStation consoles](https://help.netflix.com/en/node/23888)
- [Microsoft Xbox consoles](https://help.netflix.com/en/node/23889)
- [Apple Vision Pro](https://help.netflix.com/en/node/134000)
- [Meta Quest headsets](https://help.netflix.com/en/node/110502)`,
    // The rail on the reference carries these five, in this order. Each one lands
    // on the closest page this app actually has.
    related: [
      { label: 'What is Netflix?', to: '/p/what-is-netflix' },
      { label: 'Getting started with Netflix', to: '/p/getting-started' },
      { label: 'How to sign up for Netflix', to: '/signup' },
      { label: 'How to watch Netflix on your TV', to: '/p/devices' },
      { label: "Netflix says 'Netflix is no longer available on this device.'", to: '/p/contact' },
    ],
  },

  // help.netflix.com/en/node/54816. This article is NOT a flat run of `##`
  // sections. Read off the served markup:
  //
  //  * the four headings are <h3> at 1.4rem/1.3, so they are written as "### "
  //    here - not the 2rem "## " the other Help Center articles use;
  //  * each "Note:" is an ordinary paragraph, not the .sp-note callout box. It
  //    opens with a 20x20 icon-notes-square glyph and a bold "Note:" run;
  //  * the UI words the reader taps ("My Netflix", "Downloads", "Play", ...) are
  //    bold, and the download/play/season glyphs are inline images;
  //  * the two closing groups are BOLD PARAGRAPH heads, not headings at all -
  //    "Learn more about downloads" and "Fix common download problems" have no
  //    <hN> around them, so they are written as **bold** body text;
  //  * apostrophes are typographic (’) as in the source, not straight (').
  downloads: {
    title: 'How to download titles to watch offline',
    body: `You can watch TV shows and movies offline at any time by downloading them from the Netflix app. Learn more about finding, downloading, and watching downloaded TV shows and movies below.

To download TV shows or movies you'll need one of these devices with the latest version of the Netflix app installed:

- Android phone or tablet
- iPhone or iPad
- Amazon Fire tablet
- Google Chromebook ([with Google Play Store installed](https://support.google.com/googleplay/answer/7021273))

![](/icon-notes-square.png)**Note:** Some older operating system versions for these devices may not support downloads. Make sure your device has the latest updates installed.

### Find a TV show or movie

Find a TV show or movie and look for the **Downloads** ![](/icon_download_en.png) icon to know if it can be downloaded, or filter by what is available for download.

![](/icon-notes-square.png)**Note:** Not all TV shows and movies are available for download. To learn why, [go to this article with more information](https://help.netflix.com/en/node/54870).

To download a TV show or movie:

1. Open the Netflix app.
2. Browse all TV shows and movies available for download:
   - iPhone, iPad, Android, or Fire devices: Tap **My Netflix** > **Downloads** > **See What You Can Download**.
   - Chromebook: Click **Downloads** > **Find More to Download**.
3. Select a TV show or movie you want to download onto your device.
   - For movies, select **Download** ![](/icon_download_en.png).
   - For TV shows, select the download button ![](/icon_download_en.png) next to an episode or tap the **Download Season** ![](/icon-download-season_en.png) to download all episodes of a season.

To save on [data usage](https://help.netflix.com/en/node/87), we recommend being connected to Wi-Fi while downloading.

You can have up to 100 active downloads at a time per device based on the number of devices [included in your Netflix plan](https://help.netflix.com/en/node/24926).

If you cancel your account, downloads on your device will be deleted. If you restart your membership, you'll need to download them again.

### Watch downloaded TV shows and movies

To access and watch the downloads offline, follow the steps below.

1. Open the Netflix app.
2. Select **Downloads** ![](/icon_download_en.png).
3. Find the download you want to watch, then select **Play** ![](/icon_play_en.png).

![](/icon-notes-square.png)**Note:** While using a [Kids profile](https://help.netflix.com/en/node/114275), downloaded TV shows and movies with higher maturity ratings may not be available to watch offline.

Downloaded TV shows and movies are available on the device that was used to download them and can be viewed from any of your Netflix profiles.

Downloads will [expire after a period of time](https://help.netflix.com/en/node/54865), and some have a limit on how many times they can be downloaded per year. Once you’re done watching, [delete downloads](https://help.netflix.com/en/node/116084) from your device to free up space.

**Learn more about downloads**

- [How to use 'Smart Downloads'](https://help.netflix.com/en/node/122916)
- [How to use 'Download Next Episode'](https://help.netflix.com/en/node/101262)
- [How to use 'Downloads for You'](https://help.netflix.com/en/node/119204)
- [How to change the video quality of a download](https://help.netflix.com/en/node/116071)
- [How to store downloads on an SD card](https://help.netflix.com/en/node/116069)

**Fix common download problems**

- [Can't download a TV show or movie](https://help.netflix.com/en/node/55672)
- [Why isn’t a movie or TV show available for download?](https://help.netflix.com/en/node/54870)
- [My downloaded title says 'Expired.'](https://help.netflix.com/en/node/54865)`,
    // The reference's own four, in its order.
    related: [
      { label: 'Getting started with Netflix', to: '/p/getting-started' },
      { label: "Can't download a TV show or movie", href: 'https://help.netflix.com/en/node/65924' },
      { label: 'What is Netflix?', to: '/p/what-is-netflix' },
      { label: 'How to use Netflix on your Windows computer or tablet', href: 'https://help.netflix.com/en/node/66065' },
    ],
  },

  devices: {
    title: 'Manage your devices',
    body: `Every plan allows a set number of devices to play at the same time, and you can see and remove the ones currently signed in.

## How many devices can watch at once?

- **Basic** - 1 device at a time, HD
- **Standard** - 2 devices at a time, Full HD
- **Premium** - 4 devices at a time, Ultra HD plus downloads

> If you are signed in on more devices than your plan allows, pick which ones stay signed in - the rest are signed out automatically.

## Remove a device

Open the [Account](/account) page, choose **Manage Devices** and press **Sign Out** on the device you no longer use. Watch history and My List travel with the account rather than the device, so nothing is lost.

A device that has not streamed for 90 days is signed out automatically.`,
    related: [
      { label: 'Ways to Watch', to: '/p/ways-to-watch' },
      { label: 'Change your plan', to: '/p/change-plan' },
    ],
  },

  privacy: {
    title: 'Privacy Statement',
    body: `This Privacy Statement explains how we collect, use, and disclose your personal information when you interact with the "Netflix service” (that term and “Netflix content”” are defined in the Netflix Terms of Use available at [netflix.com/terms](/p/terms)) or anywhere we display or reference this Privacy Statement. It also explains what privacy rights you have and how to exercise them. Certain functionalities or apps that are part of the Netflix service may also provide you with contextual privacy information or choices, in addition to the information and choices described in this Privacy Statement. Please note that this Privacy Statement may be easier to navigate when viewed on your web browser.

### Contacting Us

For questions about this Privacy Statement, our use of your personal information, or how to exercise [your privacy rights](#privacy-section-b-your-rights-and-controls), please contact our Data Protection Officer/Privacy Office at [privacy@netflix.com](mailto:privacy@netflix.com). For general questions about the Netflix service, your account, or how to contact customer service, please visit [help.netflix.com](/p/help-center).

Information about the specific Netflix entity (or entities) that are responsible for your personal information (known as the “data controller”” in certain countries) is available at [netflix.com/legal/corpinfo](/p/corporate-information).

## Section A: Our Collection, Use, and Disclosure of Personal Information

### The Categories of Personal Information We Collect

We collect the following categories of personal information about you:

- **Personal details:** When you register with the Netflix service, we collect your contact information (such as your email address) and authentication information for your login (such as a password). Depending on your interaction with the Netflix service, we also collect one or more of the following: first and last name, phone number, postal address, gender, date of birth, and other identifiers you provide to us.

- **Payment details:** We collect your Payment Method (as defined in the Netflix Terms of Use), and other information to process your payments (such as when you subscribe to the Netflix service), including your payment history, billing address, and gift cards and Offers (as defined in the Netflix Terms of Use) you have redeemed.

- Purchase information: We collect purchase information such as information you provide when you make a purchase with Netflix, your purchase history and other products purchased or considered (such as those in your shopping cart), and overall purchase habits.

- Netflix account/profile information: We collect information that is associated with your Netflix account and/or Netflix profiles on your account (such as profile name and icon, Netflix game handle, ratings and feedback you provide for Netflix content), “My List”” (watch list of titles), “continue watching”” information, account/profile settings, and choices in connection with your use of the Netflix service.

- Usage information: We collect information about your interaction with the Netflix service (including playback events, such as play, pause, etc.); choices made when engaging with interactive titles, your Netflix game activity (such as gameplay, game use and interaction information, and progress or saved game information); Netflix viewing and gaming history; search queries on the Netflix service; voice inputs (including transcripts and recordings) when using voice-related features; and other information about your use and interaction with the Netflix service (such as app clicks, text input, page views, time and duration of access, and camera/photo access for QR-code functionality and Netflix games features).

- Advertising information: We collect information about the advertisements on the Netflix service that you view or interact with, device information (such as resettable device identifiers), IP addresses, inferences we make about you or your household based on data we collect from or about you (such as the types of ads you or your household prefer to see), and information provided by Advertising Companies (such as your demographic information, likely interests they have collected or inferred from your interactions and purchases through their own and other websites and apps). We also collect information on Advertiser websites and apps. We use this information to support advertisements (including behavioral advertisements in accordance with your preferences. "Behavioral Advertisements" are those that are selected based on information about your use and/or interactions with unaffiliated third party services).

- Device and network information: We collect information about your computer or other Netflix supported devices you might use to access our service (such as smart TVs, mobile devices, set top boxes, gaming systems, and other streaming media devices), your network, and network devices. The information includes:

  - device IDs or other unique identifiers, including for your network devices, and devices that are Netflix supported on your network;

  - IP addresses (which can be used to tell us the general location of your device, such as your city, state/province, and postal code);

  - device and software characteristics (such as type and configuration), referring source (for example, referrer URLs), standard web browser and mobile app log information, and connection information including type (such as wifi or cellular);

  - performance data such as crash reports, timestamps, and debug log messages; and

  - cookie data, resettable device identifiers, advertising identifiers and other unique identifiers (described below in the section “Cookies and other Technologies””).

- Communications: If you communicate with Netflix (such as contacting customer support via online chat or voice call), or engage in our surveys or feedback requests (such as when you cancel), we collect the contents of such communications. We also collect details of communications that we send you (such as via email, push notifications, text message, or within the Netflix service), and information about your interaction with these communications.

### Where We Collect Personal Information From

We collect your personal information from the following sources:

- Directly from you: When you register with the Netflix service, update your Netflix account or profile, purchase products or services from us, correspond with us, or respond to our surveys, you may provide (and we will collect) the following [categories of personal information](#privacy-the-categories-of-personal-information-we-collect): personal details, payment details, purchase information, Netflix account/profile information, and communications.

- Automatically when you use our service: We automatically collect the following [categories of personal information](#privacy-the-categories-of-personal-information-we-collect) in connection with your use of the Netflix service: Netflix account/profile information, purchase information, usage information, advertising information, device and network information, and communications.

- From Partners whose products and services you use: We may collect the following [categories of personal information](#privacy-the-categories-of-personal-information-we-collect) about you from third parties whose services you use to access, pay for, or interact with the Netflix service (“Partners””): personal details, payment details, usage information, and device and network information. The categories of personal information that Partners provide to us will vary depending on the nature of the Partner and your relationship with them. Our Partners may include your TV manufacturer, internet service provider, streaming media device provider, mobile phone carriers, or other companies who collect payment for the Netflix service. For example, Partners may provide us:

  - personal details (such as your email address), device and network information (such as IP addresses, device IDs, or other unique identifiers), or other personal information in order to activate the Netflix service, or present Netflix content to you through portions of the Partner’s user interface;

  - payment details (such as associated pre-paid promotions and billing information) if they are assisting with billing or collecting payment for the Netflix service; and

  - search queries and commands applicable to Netflix that you make through Partner devices or voice assistance platforms.

- From other sources: We may collect the following [categories of personal information](#privacy-the-categories-of-personal-information-we-collect) about you from other sources: personal details, payment details, and device and network information. These sources include:

  - Service Providers such as vendors, agents, and contractors that collect or provide personal information to Netflix in connection with services they perform on our behalf (“Service Providers””). This may include Service Providers such as those that:

    - help us determine a general geographic location based on your IP address in order to customize our service and for other uses consistent with this Privacy Statement;

    - provide us with information to secure our systems, prevent fraud, and help us protect the security of Netflix and our users;

    - provide us with payment processing services including payment or balance information, or updates to that information; and

    - provide Netflix games, or portions or features of those games, as part of the Netflix service (for example, some Netflix games are licensed from and run by Service Providers).

  - Netflix Marketing Providers when you interact with marketing campaigns promoting the Netflix service or Netflix content (such as our ads on third party services). Please see the “Cookies and other Technologies”” section below for details.

  - Third-party sites and forums where we provide support for the Netflix service (such as an online support forum for Netflix customer support or for a particular Netflix game).

  - Publicly available sources such as public posts on social media platforms (for example, where you have tagged Netflix in a publicly-available social media post, or shared or liked content we have made available on social media) and other information available through public databases, in accordance with applicable laws.

- Advertising Companies: We may collect advertising information about you from other sources to support advertisements, including the following (collectively referred to as “Advertising Companies””):

  - Advertisers that run advertisements on Netflix (“Advertisers””) may provide us with or allow us to collect unique identifiers (for example, cookies or resettable device identifiers), and demographic information and other information (such as information about the interactions and purchases on their websites and apps and likely interests they have collected or inferred based on their visitors&#x27; activities online) to deliver and support advertisements;

  - service providers that facilitate the sale, operations, and management of advertisements (“Ad Service Providers””);

  - ad measurement companies that support Netflix and Advertisers in understanding the effectiveness of advertisements (“Ad Measurement Companies””); and

  - online and offline information providers to support advertisements (for example, they may provide us your general location information based on your device’s IP address, such as city, state, and postal code, supplement information we may have about you with demographic data, or provide us information about your likely interests they have collected or inferred based on your activities online).

### How We Use Your Personal Information

We use your personal information to provide, maintain, improve, and promote the Netflix service, and to communicate with you. This involves using the [categories of personal information](#privacy-the-categories-of-personal-information-we-collect) listed above for the following purposes:

- To provide our service including making personalized recommendations for Netflix content that we think will be of interest to you (learn more: [netflix.com/recommendations](https://www.netflix.com/recommendations)). This may also include personalizing and optimizing the features and functionalities of the service (such as the way in which the recommendations are presented to you), and localizing Netflix content relevant to your geography in compliance with our content partners’ licensing terms. We use the following [categories of personal information](#privacy-the-categories-of-personal-information-we-collect) for this purpose: personal details, Netflix account/profile information, purchase information, usage information, device and network information, and communications.

- To administer and operate our business including purposes such as processing payments and any gift cards you redeem, sending transactional communications to you (such as confirmation of subscription start date or information about changes to your account), determining your internet service provider to support network troubleshooting issues, responding to your inquiries and requests, and assisting you with operational requests such as password resets. We use the following [categories of personal information](#privacy-the-categories-of-personal-information-we-collect) for this purpose: personal details, payment details, purchase information, Netflix account/profile information, usage information, device and network information, and communications.

- To research, analyze, and improve our services such as analyzing and understanding how users interact with the Netflix service, to improve our services and optimize Netflix content selection and service delivery. This may also include processing your personal information in connection with any surveys you participate in. We use the following [categories of personal information](#privacy-the-categories-of-personal-information-we-collect) for this purpose: personal details, payment details, purchase information, Netflix account/profile information, usage information, device and network information, and communications.

- To enable Partner integrations and promotions so that our Partners can promote the Netflix service and make it available to you through Partner devices and integrations, based on the specific relationship you have with the Partner. We use the following [categories of personal information](#privacy-the-categories-of-personal-information-we-collect) for this purpose: personal details, payment details, Netflix account/profile information, usage information, device and network information, and communications.

- To send marketing and informational messages including news and promotional communications about our service, new features, available Netflix content, Offers, as well as Netflix marketing on third party services. Any of these messages, including Netflix marketing on third party services, may be personalized for you or your likely interests. Please see the section “Communication Preferences”” below to change your communications preferences. To understand your choices in connection with Netflix’s marketing on third party services, please see the “Cookies and other Technologies”” section below. Depending on the nature of the message we send, we may use the following [categories of personal information](#privacy-the-categories-of-personal-information-we-collect) for this purpose: personal details, payment details, Netflix account/profile information, purchase information, usage information, device and network information, and communications.

- To support advertisements including to provide, analyze, administer, enhance, optimize, select, deliver, and measure advertisements. We use the following [categories of personal information](#privacy-the-categories-of-personal-information-we-collect) for this purpose: personal details, payment details, purchase information, Netflix account/profile information, usage information, advertising information, and device and network information.

We use your personal information to present you with advertisements. Some of our advertisements may be Behavioral Advertisements. Please see the section “Advertising Choices”” below to learn about your choices.

- For safety, security, and fraud prevention including to secure our systems, protect our business, and to investigate, prevent, and detect prohibited or illegal activities and other security/technical issues. We use the following [categories of personal information](#privacy-the-categories-of-personal-information-we-collect) for this purpose: personal details, payment details, Netflix account/profile information, usage information, advertising information, device and network information, and communications.

- To comply with law and enforce the Netflix Terms of Use including to satisfy applicable law, regulation, legal process, or governmental request, and to protect against harm to the rights, property or safety of Netflix, its users or the public, as required or permitted by law, and to enforce applicable community guidelines. This also includes determining whether a particular device is permitted to use the account consistent with the Netflix Terms of Use. We use the following [categories of personal information](#privacy-the-categories-of-personal-information-we-collect) for this purpose: personal details, payment details, Netflix account/profile information, usage information, advertising information, device and network information, and communications.

### Who We Disclose Personal Information To

We may disclose your [personal information](#privacy-the-categories-of-personal-information-we-collect) to the following parties:

- The Netflix family of companies: We share your personal information among the Netflix family of companies (see [help.netflix.com/legal/corpinfo](/p/corporate-information)) as needed for the following [purposes](#privacy-how-we-use-your-personal-information): to provide our service; to administer and operate our business; to research, analyze, and improve our services; to enable Partner integrations and promotions; to send marketing and informational messages; to support advertisements; for safety, security, and fraud prevention; and to comply with law and enforce the Netflix Terms of Use.

- Service Providers: We use Service Providers to perform services on our behalf or to assist us with the provision of services to you. For example, we use Service Providers to provide communications, security, infrastructure and IT services, game-related services, to personalize and improve our service, and to process payments. We do not authorize them to use or disclose your personal information except in connection with providing their services (which may include maintaining and improving their services). To help maintain the safety and security of our service and users, we and our Service Providers may monitor and record message content (such as text or voice chat functionality) to identify harmful behavior, security risks, and violations of the Netflix Terms of Use and community guidelines. Our Service Providers may process your personal information for the following [purposes](#privacy-how-we-use-your-personal-information): to provide our service; to administer and operate our business; to research, analyze, and improve our services; to send marketing and informational messages; for safety, security, and fraud prevention; and to comply with law and enforce the Netflix Terms of Use.

- Partners: If you have a relationship with one or more of our Partners, we may share certain personal information with them in compliance with applicable law. For example, depending on what Partner services you use, we may share personal information so that Netflix content and features can be suggested to you in the Partner’s user interface. Partners may process your personal information for the following [purposes](#privacy-how-we-use-your-personal-information): to administer and operate our business; to research, analyze, and improve our services; to enable Partner integrations and promotions; and to send marketing and informational messages.

- Netflix marketing providers: When we market Netflix on third party services, some of those services, as well as the marketing Service Providers that we use to purchase, deliver, optimize, or measure our marketing (collectively “Netflix Marketing Providers””), may receive information from us (for example, the steps completed in the Netflix registration process). Common uses of this type of information are to measure the effectiveness and optimize our marketing campaigns. Netflix uses contractual and technical measures designed to prevent Netflix Marketing Providers from accessing information regarding specific shows or movie title selections you make, URLs you land on, or shows or movies you have watched on our service. We do not share information about title selections of shows or movies you have watched on our service. Netflix Marketing Providers may process your personal information for the following [purposes](#privacy-how-we-use-your-personal-information): to research, analyze, and improve our services; and to send marketing and informational messages.

- Advertising Companies: We may disclose certain personal information to Advertising Companies (see definition above) in order to select advertisements shown on Netflix, to facilitate interaction with advertisements, and to measure and improve effectiveness of advertisements. These companies may process your personal information for the following [purposes](#privacy-how-we-use-your-personal-information): to support advertisements.

- Promotional collaborations: We may collaborate with third parties for Offers. To fulfill these types of Offers, we and the third parties may use your personal information for the following [purposes](#privacy-how-we-use-your-personal-information): to enable Partner integrations and promotions; and to send marketing and informational messages.

- Corporate transactions: In connection with a reorganization, restructuring, merger or sale, or other transfer of assets, we will transfer personal information provided the receiving party agrees to respect your personal information in a manner that is consistent with this Privacy Statement. We may disclose your personal information in such instances for the following [purposes](#privacy-how-we-use-your-personal-information): to provide our service; to administer and operate our business; to research, analyze, and improve our services; to enable Partner integrations and promotions; to send marketing and informational messages; to support advertisements; for safety, security, and fraud prevention; and to comply with law and enforce the Netflix Terms of Use.

- Safety, security and fraud prevention: Netflix and its Service Providers may disclose your personal information to third parties where we reasonably believe disclosure is needed for the [purpose](#privacy-how-we-use-your-personal-information) of: safety, security, and fraud prevention.

- Compliance with law and enforcing the Netflix Terms of Use: We may disclose your personal information as necessary to comply with applicable law, regulation, legal process, or governmental request, and processing necessary to protect against harm to the rights, property or safety of Netflix, its users or the public, as required or permitted by law. We may disclose personal information for the following [purpose](#privacy-how-we-use-your-personal-information): to comply with law and enforce the Netflix Terms of Use.

### International Transfers of Personal Information

Netflix operates from various countries around the world, as do its Service Providers, Partners, and other third parties to whom we may need to disclose your personal information, as described above. This means that when you use or interact with Netflix, your personal information may be transferred to other countries that have different data protection laws than those where you reside.

However, whenever we transfer personal information to other countries, we ensure that the personal information is transferred in accordance with applicable data protection laws and this Privacy Statement. Specifically, we use a variety of contractual, technical, and organizational measures as appropriate for such transfers, including data protection agreements, technical protections, and practices to challenge disproportionate or unlawful government authority requests. You can find out more about how we disclose and transfer your personal information internationally here: [help.netflix.com/legal/personal-information-international-transfers](https://help.netflix.com/legal/personal-information-international-transfers).

### Supplemental Privacy Disclosures

We provide supplemental information regarding certain aspects of the Netflix service (such as certain Netflix games features) in the section “[Supplemental Privacy Disclosures for Certain Services](#privacy-section-f-supplemental-privacy-disclosures-for-certain-services)”” below.

## Section B: Your Rights and Controls

### Your Privacy Rights

- Access, correct, update, or delete your personal information: You have a right to confirm whether we process your personal information and to access and receive a copy of the personal information we process about you. You may also correct or update out-of-date or inaccurate personal information or request that we delete personal information that we hold about you.

To request a copy of your personal information, please visit [netflix.com/account/getmyinfo](/account). In addition, under the "Account" section of our website, you can access and update information about your account, including your contact information, payment information, and various related information about your account. You must be logged in to access the "Account" section.

For information about deletion, removal, and retention of personal information, please see: [help.netflix.com/node/100625](https://help.netflix.com/node/100625).

- Portability and downloading a copy of your personal information: You can request portability of or download a copy of your personal information. To download a copy of your personal information go to: [netflix.com/account/getmyinfo](/account). For more information, please see: [help.netflix.com/node/100624](https://help.netflix.com/node/100624).

- Objection, restriction, and withdrawal of consent: You can object to or request that we restrict processing of your personal information. If we have collected and are processing your personal information with your consent, then you can withdraw your consent at any time. Withdrawing your consent will not affect the lawfulness of any processing we conducted prior to your withdrawal, nor will it affect processing of your personal information conducted in reliance on lawful processing grounds other than consent. For more information, please see [help.netflix.com/node/100637](https://help.netflix.com/node/100637).

- Right to complain: You have the right to complain to a data protection authority about our processing of your personal information but we encourage you to first contact us with any questions or concerns.

- Right not to be subject to automated decision making: You may have a right not to be subject to a decision made solely using automated means, where such decision would have a legal effect on you or produce a similarly significant effect.

For any other requests, or if you are unable to exercise your rights using any of the methods explained above, please contact [privacy@netflix.com.](mailto:privacy@netflix.com)​

You can exercise the rights described above when we receive a verified request in accordance with applicable law.

### Communication and Marketing Preferences

- Email and Text Messages. If you no longer want to receive certain communications from us via email or text message, please access the “Notification settings”” option for the relevant profile within the “Account”” section of our website. Alternatively, click the “unsubscribe”” link in the email or reply STOP (or as otherwise instructed) to the text message (note: you may receive a confirmation text message in this case). Please note that you cannot unsubscribe from transactional messages from us, such as messages relating to your account transactions.

- Push Notifications. You can choose to receive mobile push notifications from Netflix. Netflix will send you push notifications from time to time in accordance with any notification preferences you have set on your mobile device. If you later decide you no longer want to receive these notifications, you can use your mobile device’s settings to turn them off (or via the “Notification settings”” described in the preceding section). Please note that individual Netflix games may have their own push notifications (you can use your mobile device&#x27;s settings functionality to turn them off). We also offer push notifications on certain web browsers. If you agree to receive those notifications and later decide you no longer want to receive them, you can use your browser’s settings to turn them off.

- Matched Identifier Communications from Netflix. Some third party services allow us to reach users with online marketing about Netflix content or the Netflix service by sending privacy protective contact information to the third party. Privacy protective contact information means we use pseudonymization technologies (such as hashing) to convert the original contact information (such as an email address or phone number) into a value (typically a long alphanumeric sequence of characters) that cannot, by itself, reveal your identity or contact information. The third party compares Netflix’s privacy protective contact information with privacy protective contact information in its own database and there will be a match only if you have used the same contact information with both Netflix and the third party. If there is a match, Netflix can then choose whether or not to send Netflix marketing to you on that third party service, and can optimize and better measure the effectiveness of such marketing. You can indicate your choices regarding the Matched Identifier Communications on third party services in the “Privacy and data settings”” (for the relevant profile) within the “Account”” section of our website.

- Marketing of the Netflix service using cookies and similar technologies. To exercise choice around cookies or resettable device IDs collected for marketing of the Netflix service or Netflix content on third party service, please use the tools described in the “[Cookies and other Technologies](#privacy-section-d-cookies-and-other-technologies)”” section below.

### Advertising Choices

- Behavioral Advertising Choices for Advertisements on Netflix

We respect your Behavioral Advertising preferences, as applicable. If you are eligible for Behavioral Advertisements, a “Behavioral Advertising”” setting will be available to you in the “Privacy and data settings”” menu (for the relevant profile) of the “Account”” section of our website that you can adjust at any time.

If your Behavioral Advertisements setting is off, you will still see advertisements, but they will be non-behavioral advertisements.

An option to opt out is not provided in a Kids profile because we do not engage in Behavioral Advertising on Kids profiles.

- Digital Advertising Alliance Opt Out Control

Netflix supports the following self-regulatory programs, which provide additional privacy choices for Behavioral Advertising:

  - In Europe: [European Interactive Digital Advertising Alliance (EDAA)](https://www.youronlinechoices.com/)

  - In Canada: AdChoices: [Digital Advertising Alliance of Canada (DAAC)](https://www.youradchoices.ca/) / [Choix de Pub: l&#x27;Alliance de la publicité numérique du Canada (DAAC)](https://www.youradchoices.ca/fr)

  - In the US: [Digital Advertising Alliance (DAA)](https://youradchoices.com/)

To learn more about your personal information choices, please see [help.netflix.com/node/100637](https://help.netflix.com/node/100637).

### Cookie Choices

Your choices in connection with our use of cookies and similar technologies are described in the “Cookies and other Technologies”” section below.

### Contact and Questions

If you want to exercise any of your rights, or have a question regarding our privacy practices, please contact our Data Protection Officer/Privacy Office at [privacy@netflix.com](mailto:privacy@netflix.com).

## Section C: Access to Account and Profiles

- Sharing your account with others: If you share your account with others in your household (see Netflix Terms of Use), please ensure that they are aware of and have read this Privacy Statement. This Privacy Statement applies to their use of Netflix.

If you share or otherwise allow others to have access to your account, they may be able to see viewing information, account information in the “Account”” section of the service, and game related information such as text chat contents and saved game information. This remains true even when you use the profiles feature, although you can add a Profile Lock PIN to restrict streaming access on a profile (see [help.netflix.com/node/114277](https://help.netflix.com/node/114277)). Please note that viewing history, recommendations, “continue watching”” and similar information may be made available through various features and user experiences, such as Partner interfaces that are integrated with the Netflix service.

- Profiles: Profiles allow users on a Netflix account to have a personalized Netflix experience, built around the Netflix content of interest to them, as well as separate watch histories. Please note that profiles are available to everyone who uses your Netflix account, so that anyone with access to your Netflix account can navigate to and use, edit or delete profiles, and information within or associated with the profile (although, as noted above, you can add a Profile Lock PIN to restrict streaming access on a profile). You should explain this to others with access to your account, and if you do not want them to use or change your profile, be sure to let them know. We also have various parental controls available and you can learn more here: [help.netflix.com/node/264](https://help.netflix.com/node/264).

- Profile Transfers: The profile transfer feature on your account allows you and users with access to your account to transfer an eligible profile from your account to a separate account (including information such as viewing history and recommendations). You can change the setting for this feature in the “Account”” section of our website. You can learn more here: [help.netflix.com/node/122698](https://help.netflix.com/node/122698).

- Account Login Features: You may have the option to use certain account login features, such as email-based or text message-based login, or easier login to the Netflix app on certain devices. Please note that any device that is logged into your account will remain logged in unless you log out of those devices (following the instructions below).

- Removing device access to your Netflix account: To remove access to your Netflix account from devices that are logged into the account, visit the “Account”” section of our website, locate the “Sign out of all devices”” option, and follow the instructions to sign out of your devices. Users of public or shared devices should log out at the completion of each session. If you sell or return a computer or Netflix supported device, be sure to first log out. If you or other users on the account do not maintain the security of your email address, login information, and signed-in devices, or fail to log out a device you sell or return, then others may be able to access your Netflix account, including your personal information.

## Section D: Cookies and other Technologies

We, our Service Providers, Netflix Marketing Providers, and Advertising Companies use cookies, other similar technologies (such as pixel tags), hashed identifiers, and resettable device identifiers for various reasons. This section explains the types of technologies used, what they do, and your corresponding choices. To choose whether or not to receive cookies and similar technologies, please see the section below “[How can I exercise choice regarding these technologies?](#privacy-how-can-i-exercise-choice-regarding-these-technologies)””

### Cookies and Similar Technologies, Pixel Tags and other Identifiers

Cookies are small data files that are commonly stored on your device when you access websites and online services. The text in a cookie contains a string of numbers and letters that may uniquely identify a device and can contain other information as well. This allows the web server to recognize your browser each time it connects to that web server.

We use other technologies such as browser storage and plugins (for example, HTML5, IndexedDB, and WebSQL). Like cookies, these other technologies may store small amounts of data on a device. Pixel tags often work in conjunction with cookies. In many cases, declining cookies will impair the effectiveness of pixel tags associated with those cookies.

We may also create, use, and disclose privacy protective identifiers such as hashed identifiers. As described above, hashing is a process of converting the original contact information (such as an email address or phone number) into a value (typically a long alphanumeric sequence of characters) that cannot, by itself, reveal your identity or contact information.

If you use a Netflix app (such as the main Netflix app, or a Netflix game app) on a mobile device, tablet, or streaming media device, we may collect a resettable device identifier from your device. Resettable device identifiers can be used like cookies and are found on many mobile devices and tablets (for example, the “Identifier for Advertisers”” on Apple iOS devices and the “Google Advertising ID”” on Android devices), and certain streaming media devices.

### Why Does Netflix Use These Technologies?

We use these types of technologies for various reasons, including to provide our service (for example, by making it easy to access our service by remembering you when you return); to administer and operate our business, to research, analyze and improve our services (for example, to improve site performance, monitor visitor traffic and actions on our site, and to test the effectiveness of our user interface); to send marketing and informational messages (for example, to deliver and tailor our marketing, and to understand interactions with our emails, marketing, and marketing on third party services); to support advertisements; for safety, security and fraud prevention; and to comply with law and enforce the Netflix Terms of Use. These technologies enable Netflix, Netflix Marketing Providers, and Advertising Companies to collect personal information (such as the pages you visit and device and network information) when you use our services, and about your online activities over time across different websites.

We use pixel tags in our emails to understand how members interact with our service. Our use of pixel tags helps us understand when links within messages are clicked, or the emails are opened. We may also use pixel tags placed on Advertiser sites and applications to support advertising.

Netflix uses hashed identifiers and resettable identifiers to display marketing for our service or Netflix content on third party services, to support advertisements (including delivering advertisements to you), and for analytics and optimization purposes.

To learn more about the types of cookies used by Netflix, please [click here](/p/cookie-preferences).

### How can I exercise choice regarding these technologies?

- To exercise choice regarding cookies

For more information about cookies set through our service and to exercise choices regarding cookies, [click here](/p/cookie-preferences). We do not currently respond to web browser “do not track" signals.

- To exercise choice regarding hashed identifiers for Netflix Marketing

To exercise choice regarding Netflix’s use of hashed identifiers for Netflix marketing communications on third party services, please configure the appropriate setting under Matched Identifier Communications in the "Privacy and data settings" (for the relevant profile) within the "Account" section of our website.

- To exercise choice regarding resettable device identifiers

To exercise choice regarding Netflix’s use of resettable device identifiers (for marketing the Netflix service or Netflix content, or as used to support advertisements), please configure the appropriate setting on your device (usually found under "privacy" or "ads" in your device settings). If you choose not to allow this, you may still see marketing messages promoting Netflix and advertisements on that device but it will not be selected based on the use of a resettable device identifier. Note that your choice regarding the resettable device identifier is specific to that device.

- To exercise choice regarding other similar technologies

In addition to any choices we may offer you in the Netflix service, there are several ways to exercise choice regarding technologies that are similar to cookies, such as browser storage and plugins (for example, HTML5, IndexedDB, and WebSQL). For example, many popular browsers provide the ability to clear browser storage, typically in the settings or preferences area. See your browser&#x27;s help function or support area to learn more. Most email clients have settings that allow you to prevent the automatic downloading of images, including pixel tags, and the automatic connection to the web servers that host those images. Other technologies may be cleared from within the application.

In addition to these choices, if you want to exercise your choices for Behavioral Advertising on Netflix, please see “Advertising Choices”” above.

## Section E: Other Important Privacy Disclosures

### Sharing Functionality in our Service

You can use sharing functionality available in our service to disclose your personal information in the following ways:

- certain portions of our service may give you options to share information or send invitations to others to interact with the Netflix service (such as a game session) by email, text message, and social or other sharing applications, using the clients and apps on your device; and

- social plugins and similar technologies that allow you to share information.

Social plugins and social applications are operated by third-party social networks, and are subject to their terms of use and privacy statements. Similarly, some Netflix game features may require use of a third party service, which is subject to that service’s terms of use and privacy statement.

### Security

We use reasonable administrative, logical, physical, and managerial measures to safeguard your personal information against loss, theft, and unauthorized access, use and modification. These measures are designed to provide a level of security appropriate to the risks of processing your personal information.

### Retention of Personal Information

We may retain personal information as required or permitted by applicable laws and regulations, including to honor your choices, for our billing or records purposes, and as otherwise necessary to fulfill the purposes described in this Privacy Statement.

Specifically, we retain personal information for as long as necessary to fulfill the following [purposes](#privacy-how-we-use-your-personal-information): to provide our service; to administer and operate our business; to research, analyze, and improve our services; to send marketing and informational messages; to support advertisements; for safety, security, and fraud prevention; and to comply with law and enforce the Netflix Terms of Use. Our retention of personal information is based on many factors such as your relationship with Netflix (for example, whether you are a current Netflix member), the nature of the personal information, our legal obligations, and the need to defend or resolve current or anticipated legal claims.

We take reasonable measures to destroy or de-identify personal information in a secure manner when it is no longer required. For information about retention of personal information, please see: [help.netflix.com/node/126558](https://help.netflix.com/node/126558).

### Other Websites, Platforms and Applications

The Netflix service may use, or be provided through, features operated by third party platforms (such as the display of social media content, or the provision of voice controls), or contain links to sites operated by third parties. In addition, you may encounter third party applications that interact with the Netflix service. These third parties have their own privacy statements.

For example, you may be able to access the Netflix service through platforms such as smart TVs, mobile devices, set top boxes, gaming systems, and other internet-connected devices. These platforms have separate privacy statements, notices, and terms of use, which we recommend you review.

The Netflix service may include interactive advertisements that direct you to third party sites and apps (such as that of Advertisers). These sites and apps have separate privacy statements, notices, and terms of use, which we recommend you review.

We may provide support for the Netflix service (such as an online support forum for Netflix customer support, or a particular Netflix game). Information that you post or make available on such sites and forums are publicly available (unless otherwise noted on the site or forum).

### Minors

You must be at least 18 years of age or older (or the age of majority in your country of residence) to subscribe to the Netflix service. Individuals under this age may only use the service with the involvement, supervision, and approval of a parent or legal guardian. To assist parents or legal guardians, we have various parental controls available and you can learn more here: [help.netflix.com/node/264](https://help.netflix.com/node/264).

### Changes to this Privacy Statement

We will update this Privacy Statement from time to time in response to changing legal, regulatory, or operational requirements. We will provide notice of any such changes as required by law. Your continued use of the Netflix service after any such updates take effect will constitute acknowledgement and (as applicable) acceptance of those changes. If you do not want to acknowledge or accept any updates to this Privacy Statement, you may cancel your account. To see when this Privacy Statement was last updated, please see the "Last Updated" date below.

## Section F: Supplemental Privacy Disclosures for Certain Services

The Supplemental Privacy Disclosures for Certain Services below apply in addition to disclosures above in this Privacy Statement.

## Netflix Games Supplemental Privacy Disclosures

When you play Netflix games, we will collect, use, and disclose your personal information as described in the Netflix Privacy Statement. These Netflix Games Supplemental Privacy Disclosures provide additional examples and information applicable to Netflix games that have features such as leaderboards, achievements, local multiplayer, online multiplayer, friend-related features, text or voice chat, user-generated content, and the ability to play Netflix Game Controller.

### The Categories of Personal Information We Collect

When you play Netflix games, we collect the [categories of personal information](#privacy-the-categories-of-personal-information-we-collect) described in the Netflix Privacy Statement. If you play games with the features mentioned above (or similar features), the following provides additional examples of the personal information we may collect:

- Netflix account/profile information: We collect information that may be associated with your Netflix account/profile, such as your game handle, friend or team list selections and the names of those teams, when you use features such as local multiplayer (for example, when players connect to a “Netflix Game on TV”” such as by scanning a QR code on the TV) and online multiplayer (interacting with other online players in the game).

- Usage Information: We collect information about you and your use of Netflix games, such as:

  - Your leaderboard status, score, and game achievements;

  - Whether you are online and/or playing a game in order to display your online or availability status to other players in the game and/or to your friend or team list;

  - Your searches for and connections with other players within a Netflix game (for example, searching for and connecting to a player);

  - Your gameplay, interactions, or text or voice chat with other players as a part of local multiplayer and online multiplayer features;

  - Your use of the Netflix Game Controller or other devices to play Netflix games, including information from input methods like motion detection or mobile device sensors;

  - Your reports of violations of the Netflix Games Community Guidelines ([help.netflix.com/legal/gamescommunityguidelines](https://help.netflix.com/legal/gamescommunityguidelines)) and any similar guidelines for Netflix games, and reports from other players about your potential violations; and

  - Your input of user-generated content within a Netflix game, such as drawings, uploaded content (such as photos/selfies, videos, sound recordings, or other content), or your selection of content from a third party service.

- Device and network information: When you use Netflix Game Controller functionality to connect to a Netflix game (such as a “Netflix Game on TV””), we collect information about the app, device, and the Netflix account (if you are logged in) on which the Netflix Game Controller is running.

### How We Use Your Personal Information

When you play Netflix games, we [use personal information](#privacy-how-we-use-your-personal-information) as described in the Netflix Privacy Statement. If you play games with the features mentioned above (or similar features), the following provides additional examples of how we may use your personal information:

- To provide our service: When you play Netflix games that include these features (or similar features), we use your personal information in order to provide the game including the features, as described below. We use the following categories of personal information used to provide our service with these features: Netflix account/profile information, usage information, and device and network information. In particular:

  - For features such as leaderboards and game achievements, we use your personal information (such as your game handle), in order to display the leaderboard and achievements to you and other players;

  - For features that enable you to find or interact with other players in Netflix games (such as online multiplayer games), we use your personal information and the personal information you provide about others in order to find that player and send them your connection request (and for them to find you and send you a connection request);

  - For online multiplayer games, we may display the general location of your device (such as your city, state/province, or country), and use that information to match you with other players that are close to the relevant game server so that your gameplay is less likely to be interrupted by internet delays;

  - For communication features, such as text or voice chat, we transmit communications you send to another player or group of players and deliver communications they send to you. Note that we may use Service Providers to perform services related to these communications on our behalf (as described in the Privacy Statement), which may include providing text or voice chat, moderation, and related services; and

  - For user-generated content features, we use your personal information to display your user-generated content to other players in the Netflix game, or in accordance with how you have shared the user-generated content (for example, on a third party service).

- For safety, security, and fraud prevention: When you play Netflix games with text or voice chat, or user-generated content features, we use the following categories of personal information for safety, security and fraud prevention including to secure our systems, protect our business, and to investigate, prevent, and detect prohibited or illegal activities and other security/technical issues: personal details, payment details, Netflix account/profile information, usage information, advertising information, device and network information, and communications. We and our Service Providers may monitor and/or record text and voice chat during your use of those features (but do not have the obligation to do so) for the preceding reasons, including to enforce the Netflix Games Community Guidelines ([help.netflix.com/legal/gamescommunityguidelines](https://help.netflix.com/legal/gamescommunityguidelines)).

### Who We Disclose Personal Information To

When you play Netflix games, we may [disclose personal information](#privacy-who-we-disclose-personal-information-to) as described in the Netflix Privacy Statement. If you play games with the features mentioned above (or similar features), the following provides additional examples of how we may disclose your personal information:

- Compliance with law and enforcing the Netflix Terms of Use: When you play Netflix games with communications features (such as text or voice chat), Netflix and its Service Providers may access, preserve, and disclose your information in response to legal requests from third parties, including government agencies and civil litigants. We respond to legal requests where we have a good faith belief that we are required by law to respond, or where we have a good faith belief that a response is required by law in that jurisdiction and the request is consistent with internationally recognized standards such as the International Covenant on Civil and Political Rights. We disclose personal information for the following [purposes](#privacy-how-we-use-your-personal-information): to comply with law and enforce the Netflix Terms of Use.

### Other Players

Information such as your game handle, your gameplay, text or voice chat, and user-generated content (including personal information and other information you provide in these features), and your online status may be publicly available to other players when you participate in a Netflix game with features such as leaderboards, local multiplayer, online multiplayer, text or voice chat, Netflix Game Controller, and user-generated content. Note that some games may allow you to play with players from other (non-Netflix) versions of the game, and in that case, this information will be available to those players. Please use good judgment when using text or voice chat and user-generated content functions (note that even if you remove text chat, other messages, or user-generated content, players that have already seen that information may have saved it).

### Games on TV and on Netflix.com

Some “Netflix Games on TV and on Netflix.com”” (see [help.netflix.com/node/132197](https://help.netflix.com/node/132197)) allow you to connect to a game on a Netflix member’s account using a Netflix app on your device – for example, by scanning a code on their TV so you and the member can play a game together. For some of these games, you may not need to be logged into a Netflix account in order to play the game. In that case, some of the disclosures in the Privacy Statement and these Netflix Games Supplemental Privacy Disclosures will not apply to you, such as those relating to collection and use of personal details (see definition above), and the sections related to payment details and billing. Information that is collected as part of “Netflix Games On TV or Netflix.com,”” such as usage information, device and network information, communications, and saved games or game activity, may be linked to the Netflix account on which the game is running.

**Last Updated:** April 10, 2026`,
    related: [
      { label: 'Cookie Preferences', to: '/p/cookie-preferences' },
      { label: 'Contact Us', to: '/p/contact' },
    ],
  },

  // Modelled on help.netflix.com/legal/termsofuse, which is the same
  // black-header + white-document shell as the Privacy Statement (body class
  // "page-article legal-document") but with NO section rail: its .pane-wrapper
  // holds only the prose column, so it renders single-width - same as
  // /legal/notices.
  //
  // Structure notes, because this document does not use the usual heading rules:
  //
  //  - The seven numbered sections are <h2>, so they are marked "##" here.
  //  - The numbered SUBSECTIONS ("1.1. Access to the Netflix Service") are NOT
  //    block headings. On the reference they are a bold run-in lead at the head
  //    of the paragraph that follows, with a space then the sentence's own
  //    period - the source runs "...Access to the Netflix Service . To use the
  //    Netflix service you must have...". They are therefore marked **bold**
  //    inside the paragraph rather than "###", which would put them on their own
  //    line at 18px and break the paragraph in half.
  //  - The all-caps arbitration notice is a bold paragraph, not a callout.
  //  - There is no "Related Articles" strip and no rail on this page.
  terms: {
    title: 'Netflix Terms of Use',
    body: `Welcome to Netflix! Netflix provides a service that allows users to access entertainment content ("Netflix content") over the Internet on certain Internet-connected TVs, computers and other devices ("Netflix supported devices").

These Terms of Use govern your use of our service. As used in these Terms of Use, "Netflix service", "our service" or "the service" means the service provided by Netflix for discovering and accessing Netflix content. This includes all personalization, features and functionalities, recommendations and reviews, our websites, applications and user interfaces, as well as all content and software associated with our service.

**THESE TERMS OF USE REQUIRE YOU TO RESOLVE MOST DISPUTES WITH NETFLIX IN ARBITRATION, NOT IN COURT, UNLESS YOU EXERCISE YOUR TIME-LIMITED RIGHT TO OPT OUT OF THAT REQUIREMENT. THIS MEANS THAT YOU WILL NOT BE ABLE TO HAVE A JUDGE OR JURY DECIDE THE DISPUTE. SEE SECTION 6 BELOW FOR FULL DETAILS.**

## 1. The Netflix Service

**1.1. Access to the Netflix Service** . To use the Netflix service you must have Internet access and a Netflix supported device. Some features, content, or offerings may be available at no cost and may be accessed without creating an account or providing a Payment Method, while other options require you to create a Netflix account or purchase a subscription, subject to the subscription terms outlined below. You may also be able to use the Netflix service as a profile user under an Account Owner's subscription, provided you are part of the same household, or, in countries where this feature is available, as an Extra Member if you do not live in the same household as the Account Owner. As used in these Terms, "Account Owner" means the user who created the Netflix account and whose Payment Method is charged for the subscription.

**1.2. Age Limitation** . You must be at least 18 years of age, or the age of majority in your province, territory or country, to create a Netflix account or, where available, to become an Extra Member. Minors may only use the service under the supervision of an adult.

**1.3. Offers** . We may from time to time provide special promotional offers (such as sweepstakes, discounts and other incentives), plans or subscriptions ("Offers"). Offer eligibility is determined by Netflix at its sole discretion and we reserve the right to revoke an Offer and put your account on hold in the event that we determine you are not eligible. Members of households with an existing or recent Netflix account may not be eligible for certain introductory Offers. We may use information such as device ID, method of payment or your contact information to determine Offer eligibility. The eligibility requirements and other limitations and conditions will be disclosed when you sign-up for the Offer or in other communications made available to you.

**1.4. Account Sharing** . The Netflix service and any content accessed through it are for your personal, non-commercial use only and may not be shared with anyone outside of your household, unless, in countries where this feature is available, you purchased an Extra Member Account.

**1.5. Access Limitations** . You may access the Netflix content primarily within the country in which you have established your account and only in geographic locations where we offer our service and have licensed such content. The content that may be available will vary by geographic location, may be limited by law or by the rights that our third-party content providers grant to us, and will change from time to time. The number of devices on which you may simultaneously watch depends on your chosen subscription plan and is specified on the "Account" page.

**1.6. Availability and Testing** . The Netflix service, including the Netflix content, is regularly updated. As a result, we do not guarantee that particular content will be available on the Netflix service at any given time. While we strive to provide a consistent and high-quality experience, some content or features may be temporarily unavailable due to maintenance, technical issues, or for other reasons outside of our control.

## 2. Subscriptions

**2.1. Pricing and Billing** . Netflix offers a range of subscription plans. The plan you choose, and the price you pay for it, is set out on the "Account" page. We charge your Payment Method on the date you sign up, and then on the same date each billing cycle until you cancel.

**2.2. Billing Cycle** . Subscriptions run in monthly billing cycles measured from the date you sign up. If you cancel, your access continues until the end of the billing period you have already paid for.

**2.3. Cancellations and Refunds** . You can cancel at any time through the "Account" page or by contacting us. We do not offer refunds except where required by law or where the terms of an Offer we made to you say otherwise.

**2.4. Third-Party Promotional Offers** . Some Offers may be provided by a third party rather than by us. Where that is the case, the third party is responsible for the Offer, and its terms apply in place of these Terms of Use to the extent they conflict.

## 3. Devices and Equipment

**3.1. In General** . You may access the Netflix service on any Netflix supported device. Where a device is made available by a third-party manufacturer or retailer, that party's own terms may also apply to your use of the device.

**3.2. Software Updates** . Some Netflix supported devices receive software or firmware updates that the device's manufacturer delivers. Those updates may be required to keep using the Netflix service, and they are provided under the manufacturer's own terms rather than these Terms of Use.

## 4. Content

**4.1. In General** . The Netflix content is licensed to you, not sold. We grant you a limited, personal, non-transferable and non-exclusive right to access and use the Netflix content for your personal, non-commercial use, for as long as your subscription is active.

**4.2. Our Content** . The Netflix content, including all artwork, titles, audio, subtitles, metadata and other content and software associated with the service, is owned by Netflix or its licensors. Except as expressly permitted, we do not grant you any right to use, modify, copy, distribute, perform, display, make derivative works of, or exploit all or any portion of the Netflix content in any manner.

**4.3. Reviews and Ratings** . You may submit a review or rating for the Netflix content. You grant us a worldwide, perpetual, irrevocable, royalty-free, non-exclusive licence to use your review or rating in any media now known or later developed.

**4.4. Removal** . We may remove or restrict access to any content, in any country, where we believe it to be necessary or appropriate to protect our rights, those of our licensors, or to comply with law.

## 5. Prohibited Uses

**5.1. In General** . You may not, and may not encourage, enable or assist anyone else to: use the service for any unlawful purpose; circumvent, disable or interfere with any security or anti-piracy measure; scrape, crawl or otherwise extract content or personal data from the service by any means; interfere with or disrupt the service, its servers or the networks connected to it; or resell, rent or sublicense access to the service.

**5.2. Content-Specific Prohibitions** . You may not, and may not allow others on your account to: record, copy, reproduce, distribute or transmit any part of the Netflix content except as expressly permitted; bypass, circumvent or remove any of Netflix's or its licensors' restrictions; or make any use of the content for any commercial purpose.

## 6. Disputes

**6.1. Arbitration** . THESE TERMS OF USE REQUIRE YOU TO RESOLVE MOST DISPUTES WITH NETFLIX IN ARBITRATION, NOT IN COURT, UNLESS YOU EXERCISE YOUR TIME-LIMITED RIGHT TO OPT OUT OF THAT REQUIREMENT. THIS MEANS THAT YOU WILL NOT BE ABLE TO HAVE A JUDGE OR JURY DECIDE THE DISPUTE. This Arbitration Agreement governs any dispute between you and Netflix that arises out of or relates to your use of the Netflix service or these Terms of Use, whether in contract, tort or otherwise.

**6.2. Opt-Out** . You may opt out of the Arbitration Agreement by sending a written notice to Netflix stating that you opt out of the arbitration requirement. If you opt out, neither you nor Netflix may raise a Dispute in court against the other, and any such court proceeding is barred.

**6.3. Notice of Dispute** . Before commencing arbitration, you or Netflix must send the other a written Notice of Dispute describing the nature of the claim and any supporting documents. If Netflix does not resolve the Dispute within thirty days of receiving the Notice, the Dispute may be brought before an arbitrator.

**6.4. Arbitration Process** . The arbitration will be administered by JAMS. You and Netflix will each pay our own share of the arbitration fees. Any arbitral award is final and binding, and the parties agree that it may be entered as a judgment in any court of competent jurisdiction.

**6.5. Time Limit** . To the fullest extent permitted by applicable law, you or Netflix must send a Notice of Dispute within two years from when the Dispute first arose. The failure to provide a Notice of Dispute within that time bars the Dispute.

## 7. Miscellaneous

**7.1. Governing Law** . These Terms of Use shall be governed by and construed in accordance with the laws of the Republic of Singapore. These terms will not limit any consumer protection rights that you may be entitled to under the mandatory laws of your country of residence.

**7.2. Unsolicited Materials** . Netflix does not accept unsolicited materials or ideas for Netflix content and is not responsible for the similarity of any of its content or programming in any media to materials or ideas transmitted to Netflix.

**7.3. Feedback** . Netflix is free to use any comments, information, ideas, concepts, reviews, or techniques or any other material contained in any communication you may send to us ("Feedback"), including responses to questionnaires or through postings to the Netflix service, including our websites and user interfaces, worldwide and in perpetuity without further compensation, acknowledgement or payment to you for any purpose whatsoever including developing, manufacturing and marketing products and creating, modifying or improving the Netflix service. In addition, you agree not to enforce any "moral rights" in and to the Feedback, to the extent permitted by applicable law.

**7.4. Customer Support** . To find more information about our service and its features or if you need assistance with your account, please visit the Netflix Help Center, which is accessible through netflix.com. In certain instances, Customer Service may best be able to assist you by using a remote access support tool through which we have full access to your computer. If you do not want us to have this access, you should not consent to support through the remote access tool, and we will assist you through other means. In the event of any conflict between these Terms of Use and information provided by Customer Support or other portions of our websites, these Terms of Use will control.

**7.5. Survival** . If any provision or provisions of these Terms of Use shall be held to be invalid, illegal, or unenforceable, the validity, legality and enforceability of the remaining provisions shall remain in full force and effect.

**7.6. Changes to these Terms and Assignment** . We may, from time to time, change these Terms of Use. In case of material changes we will notify you at least one month before such changes apply to you. If you do not wish to accept the changes, you can terminate your account before they take effect. We may assign or transfer our agreement with you including our associated rights and obligations at any time and you agree to cooperate with us in connection with such an assignment or transfer.

**7.7. Events Beyond our Reasonable Control** . The Netflix service and/or some of the Netflix content may not be available at any time as a result of events beyond our reasonable control, including: (i) power or server outages; (ii) acts or failures of any kind by third parties such as network providers; (iii) war, riots, strikes, or social unrest; and/or (iv) any other events or factors beyond our reasonable control. While we will make reasonable efforts to notify you in advance, to the extent permitted by applicable law, we will not be held liable should such events occur.

**7.8. Electronic Communications** . We will send you information relating to your account (e.g. payment authorizations, invoices, changes in contact details or Payment Method, confirmation messages, notices) in electronic form only.`,
    // Drawn by <p class="sp-p np-last-updated"> on the legal-document shell, the
    // same way /legal/notices shows its own date.
    lastUpdated: 'April 10, 2026',
  },

  contact: {
    title: 'Contact Us',
    body: `We are here to help. Pick whichever route suits the problem - a self-service answer is usually fastest.

## Before you write to us

Most questions are already answered:

- [Help Center](/p/help-center) - browse by topic
- [FAQ](/p/faq) - plans, cancellation, devices, kids
- [Can't sign in to Netflix](/p/sign-in-help) - the most common problem
- [Speed test](/p/speed-test) - rules out a connection problem in one click

## Email

Write to **support@newflix.local**. We reply within 24 hours, and you can track replies in your inbox.

> Please include the email address on the account and what you were trying to do. Never send us your password or full card number - we will never ask for either.

## In-app support

If you are signed in, open the avatar menu and choose **Help** to raise a request without leaving the site.

## Social

Updates and announcements are posted on the official channels linked from the [Media Center](/p/media-center).`,
    related: [
      { label: 'Help Center', to: '/p/help-center' },
      { label: "Can't sign in to Netflix", to: '/p/sign-in-help' },
      { label: 'FAQ', to: '/p/faq' },
    ],
  },

  'cookie-preferences': {
    title: 'Cookie Preferences',
    // Rendered as a live toggle panel, not prose.
    interactive: 'cookies',
    body: `Cookies are small files a site stores on your device. This service uses only what it needs to work - there is no advertising and nothing sold to third parties.

## What we use

- **Essential** - keeping you signed in, holding your session token, and remembering your language and this consent choice. These cannot be turned off, because without them you cannot sign in.
- **Preferences** - the quality you picked, autoplay on or off, and which profile you were last using.

## What we do not use

No advertising, analytics or cross-site tracking cookies. Nothing you watch is shared with a third party.

> You can change your choice at any time by coming back to this page. Clearing your browser cookies signs you out everywhere.`,
    related: [
      { label: 'Privacy', to: '/p/privacy' },
      { label: 'Terms of Use', to: '/p/terms' },
    ],
  },

  'speed-test': {
    title: 'Speed Test',
    // Rendered as a live measurement, not prose.
    interactive: 'speed',
    body: `How fast is your connection? This test measures it by timing a real download from the server, so the number reflects your actual connection and not a guess.

## What to expect

- **15 Mbps or more** - 4K streams comfortably
- **5 Mbps** - 1080p streams smoothly
- **3 Mbps** - 720p is fine
- **below 1 Mbps** - playback will stall; try a wired connection or move nearer the router

## If the test is slow

- Pause other downloads and video calls on the same connection.
- Use a wired connection rather than Wi-Fi.
- Test again on the device you normally watch on - a phone on mobile data is a different number from a laptop on fibre.`,
    related: [
      { label: 'Manage your devices', to: '/p/devices' },
      { label: "Can't sign in to Netflix", to: '/p/sign-in-help' },
    ],
  },

  'corporate-information': {
    title: 'Corporate Information',
    body: `## About this service

This is an independent streaming platform project. It is a personal, non-commercial build and is **not** affiliated with, endorsed by, or connected to Netflix, Inc. Netflix and the Netflix wordmark are trademarks of their respective owner, used here only to describe the experience this project imitates.

## Registered details

- **Entity** - Newflix (personal project)
- **Contact** - support@newflix.local
- **Region** - Pakistan

## Offices

There are no corporate offices to visit. This service is run remotely.

## Press and media

For interviews, artwork requests or anything press-related, see the [Media Center](/p/media-center).`,
    related: [
      { label: 'Media Center', to: '/p/media-center' },
      { label: 'Investor Relations', to: '/p/investor-relations' },
      { label: 'Legal Notices', to: '/p/legal-notices' },
    ],
  },

  'legal-notices': {
    title: 'Legal Notices',
    // Verbatim from help.netflix.com/legal/notices. The headings are <h3> on the
    // reference (sprinklr h3 -> margin-top:40px, 18px/700), not the <h2> the
    // Privacy Statement uses, so they are marked ### rather than ## here.
    // The "Notices" panel is a collapsible section, so its body is not markdown:
    // it is carried on `notices` and drawn by <NoticesPanel />.
    body: `The Netflix service, including all content provided on the Netflix service, is protected by copyright, trademark, trade secret or other intellectual property laws and treaties.

### Copyrights

The copyrights in the content on our service are owned by many great producers and production companies, including Netflix. If you believe your or someone else's copyrights are being infringed upon through the Netflix service, let us know by completing the Copyright Infringement Claims form ([www.netflix.com/copyrights](https://www.netflix.com/copyrights)).

### Trademarks

Netflix, the N Logo and its sonic Tudum ident are trademarks of Netflix, Inc.

Unless you have our permission, do not use the Netflix marks as your own or in any manner that implies sponsorship or endorsement by Netflix.

A product branded with the Netflix name or logo is a reflection of Netflix. Unless you are one of our licensees, we don't allow others to make, sell, or give away anything with our name or logo on it.

### Patents

Netflix applications and services are covered by patents. For information on patents related to our services please visit [www.netflix.com/patents](https://www.netflix.com/patents).

### Third Party Notices

Netflix applications, software development kits (SDKs) and other Netflix products may contain software available under open source or free software licenses ("Open Source Software"). The Netflix Terms of Use do not alter any rights or obligations you may have under those Open Source Software licenses. Additional information about Open Source Software, including required acknowledgements, license terms and notices, can be found below.`,
    // The six third-party notice PDFs, in the order the reference lists them.
    // Each is a separate <ul> on the live page, which is what puts a full gap
    // between rows rather than the 8px a single list would give.
    notices: [
      { label: 'Netflix Ready Device Platform', href: 'https://help.nflxext.com/legal/NRDP_Third_Party_Notices.pdf' },
      { label: 'Android TV', href: 'https://mcp-cms-us-east-1.s3.us-east-1.amazonaws.com/external/legal/Android+TV+-+Third+Party+Notices+.pdf' },
      { label: 'Android App', href: 'https://mcp-cms-us-east-1.s3.us-east-1.amazonaws.com/external/legal/Android+App+-+Third+Party+Notices+.pdf' },
      { label: 'Apple TV', href: 'https://mcp-cms-us-east-1.s3.us-east-1.amazonaws.com/external/legal/Apple+TV+-+Third+Party+Notices+.pdf' },
      { label: 'iOS App', href: 'https://mcp-cms-us-east-1.s3.us-east-1.amazonaws.com/external/legal/Apple+iOS+App+-+Third+Party+Notices+.pdf' },
      { label: 'Games', href: 'https://mcp-cms-us-east-1.s3.us-east-1.amazonaws.com/external/legal/Games+SDK+-+Third+Party+Notices+.pdf' },
    ],
    lastUpdated: 'September 25, 2023',
  },

  'media-center': {
    title: 'Media Center',
    body: `Press, creators and partners - here is where to reach us.

## Press enquiries

For interviews, comment or review copies, email **press@newflix.local**.

## Artwork

Posters, banners and logos come from TMDB and belong to their respective owners. Artwork is not licensed for reuse; see [Legal Notices](/p/legal-notices).

## Brand assets

The wordmark and site design are part of this independent project and may not be used to imply endorsement.

## Creator submissions

We do not currently accept outside submissions.`,
    related: [
      { label: 'Corporate Information', to: '/p/corporate-information' },
      { label: 'Investor Relations', to: '/p/investor-relations' },
      { label: 'Contact Us', to: '/p/contact' },
    ],
  },

  'investor-relations': {
    title: 'Investor Relations',
    body: `## This is a personal project

There is no public company behind this service, so there are no shares, quarterly reports, earnings calls or annual meetings to read.

## Financial information

None is published. The service has no investors and is funded independently.

## What you can do instead

- [Change your plan](/p/change-plan) or [cancel](/p/cancel-membership) from the [Account](/account) page
- Read the [FAQ](/p/faq) for plans and pricing`,
    related: [
      { label: 'Corporate Information', to: '/p/corporate-information' },
      { label: 'Jobs', to: '/p/jobs' },
    ],
  },

  jobs: {
    title: 'Jobs',
    body: `## Open roles

There are no open positions right now. This is an independent project maintained by one person, so there is no hiring team to apply to.

## Speculative applications

Speculative applications are not read, so please do not send one.

## What actually helps

- Report a bug through [Contact Us](/p/contact) - that genuinely helps.
- Read the [Help Center](/p/help-center) to see what is already supported.`,
    related: [
      { label: 'Investor Relations', to: '/p/investor-relations' },
      { label: 'Contact Us', to: '/p/contact' },
    ],
  },

  'only-on-netflix': {
    title: 'Only on Netflix',
    body: `Titles that exist here and nowhere else - originals and exclusives in the catalogue.

## Where to find them

- The **New on StreamFlix** row on [New & Popular](/browse/new)
- **Top 10 Today** on the same page for what is most watched
- [Top Rated Movies](/browse/tmdb-top-rated-movies) in the browse catalogue, sorted by rating

## What makes a title exclusive here

Anything the site owner has added directly rather than pulled from the shared catalogue. Exclusives tend to be films and series rather than studio libraries, because a studio library is rarely available on its own.`,
    related: [
      { label: 'New & Popular', to: '/browse/new' },
      { label: 'Help Center', to: '/p/help-center' },
    ],
  },

  // help.netflix.com/en/node/134094. The Sprinklr source uses an empty <h2> as a
  // bare 40px spacer between the two address sections and marks each address
  // with "::", both of which parseBlocks understands. The wording is the
  // reference's, links included.
  //
  // The two help links used to point at help.netflix.com itself, because this
  // clone had no matching pages. It does now: "contact us" and "Request TV shows
  // or movies" are real routes, so they point here and the reader stays in the app.
  'corporate-information': {
    title: 'Corporate Information',
    body: `We're here to help if you need it -- for the fastest answer to your questions, we encourage you to reach out to our customer service. Visit the [Help Center](/p/help-center) for more info or [contact us](/p/contact).

If you have a request for a TV show or movie, see [Request TV shows or movies](/p/title-request).

##

**Contractual partner and point of contact for Netflix members:**

::
Netflix Pte. Ltd.
9 Straits View, Marina One West Tower #14-07/12
Singapore 018937
Registration ID No. 201531197W

##

**Data Controller:**

::
Netflix Pte. Ltd.
9 Straits View, Marina One West Tower #14-07/12
Singapore 018937
Registration ID No. 201531197W`,
    related: [
      { label: 'Billing and Payments', to: '/p/billing-and-payments' },
      { label: 'How to download titles to watch offline', to: '/p/downloads' },
      { label: 'How to create, edit, or delete profiles', to: '/p/profiles' },
      { label: "Netflix isn't working", to: '/p/contact' },
      { label: 'How to search and browse Netflix', to: '/p/help-center' },
    ],
  },

  // The two Help Center articles the title request form links to. The reference
  // sends them to node 60541 and node 47765; here they are real pages so the
  // form's inline links land on something instead of a dead route.
  'why-titles-leave-netflix': {
    title: 'Why do TV shows and movies leave Netflix?',
    body: `Our content catalog changes all the time as we add and remove titles. A title may leave Netflix because its licensing agreement has ended, because the studio that makes it is working with another service, or because we have decided to stop offering it in your region.

### What happens when a title leaves

When a title is removed we try to let you know before it goes. If you have the title in My List, it stays there, but it will show as unavailable until it is added back or removed from the service.

### Will the title come back?

Licensing deals are time-limited, so a title can return later. Turning on notifications for a title lets you know as soon as it is available again.

If you cannot find a title you expected to see, try [How do I find TV shows and movies on Netflix?](/p/find-tv-shows-and-movies).`,
    related: [
      { label: 'How do I find TV shows and movies on Netflix?', to: '/p/find-tv-shows-and-movies' },
      { label: 'Request TV shows or movies', to: '/p/title-request' },
      { label: 'Only on Netflix', to: '/p/only-on-netflix' },
    ],
  },

  'find-tv-shows-and-movies': {
    title: 'How do I find TV shows and movies on Netflix?',
    body: `Search is the fastest way to find a specific title. Tap the search icon, type part of the title, a genre, or a person you know is in it, and matching titles appear as you type.

### Browsing by category

If you would rather browse, the category rows on the home screen are grouped by genre, mood and popularity. Scroll down for more, and the row order changes over time to reflect what is popular in your region.

### Using the interface

- **Search** for a title by name, actor or director.
- **My List** keeps everything you have saved in one place.
- **Add to My List** saves a title without downloading it.

If a title you want is not on the service, you can [request it](/p/title-request). If a title you expected has gone, see [Why do TV shows and movies leave Netflix?](/p/why-titles-leave-netflix).`,
    related: [
      { label: 'Why do TV shows and movies leave Netflix?', to: '/p/why-titles-leave-netflix' },
      { label: 'Request TV shows or movies', to: '/p/title-request' },
      { label: 'Ways to Watch', to: '/p/ways-to-watch' },
    ],
  },

  about: {
    title: 'About Us',
    body: `An independent streaming platform project - movies, dramas and series, on any screen.

## What we do

We build a Netflix-style streaming experience: personalised home rails, a browsable catalogue, profiles with parental controls, and playback that remembers where you stopped.

## Not affiliated

This is a personal, non-commercial project and is not affiliated with Netflix, Inc. See [Legal Notices](/p/legal-notices).`,
    related: [
      { label: 'Corporate Information', to: '/p/corporate-information' },
      { label: 'Contact Us', to: '/p/contact' },
    ],
  },
};

// Slugs that render inside the Help Center chrome (breadcrumb + "Need more help?"
// footer) rather than as a standalone legal page.
export const HELP_SLUGS = new Set([
  'help-center', 'what-is-netflix', 'getting-started', 'sign-in-help', 'profiles',
  'billing-and-payments', 'change-plan', 'cancel-membership', 'devices', 'downloads',
  'ways-to-watch', 'speed-test', 'corporate-information',
  'why-titles-leave-netflix', 'find-tv-shows-and-movies',
]);

export const hasContent = (slug) => Boolean(CONTENT[slug]);

