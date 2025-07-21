# Customizable New Tab Page

A customizable new tab page for your browser, allowing you to quickly access your favorite links, perform Google searches, and manage your Browse experience.

## Features

-   **Quick Links**: Add, edit, and delete your frequently visited websites.
-   **Customizable Layout**: Adjust the number of links per row and the total number of rows displayed.
-   **Sort by Clicks**: Optionally sort your links by click frequency for easier access to your most used sites.
-   **Google Search Integration**: Directly search Google from the new tab page.
-   **Dynamic Title Fetching**: Automatically fetch a website's title from its URL when adding new links.
-   **Data Management**: Export and import your link data for backup or transfer.
-   **Multilingual Support**: Available in English, Japanese, and Traditional Chinese.
-   **Responsive Design**: Adapts to various screen sizes.

## How to Use

1.  **Download**: Clone or download this repository.
2.  **Browser Extension**:
    * **Chrome**:
        1.  Open Chrome and navigate to `chrome://extensions`.
        2.  Enable "Developer mode" in the top right corner.
        3.  Click "Load unpacked" and select the directory where you downloaded this project.
    * **Firefox**:
        1.  Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
        2.  Click "Load Temporary Add-on..." and select any file inside the project directory (e.g., `index.html`).
    * *Note: For other browsers, refer to their specific documentation for loading unpacked extensions or custom new tab pages.*
3.  **Set as New Tab Page**: Configure your browser to use this HTML file as your new tab page. This process varies by browser. For Chrome, after loading it as an extension, it should automatically override the default new tab page.

## Development

### Technologies Used

* HTML5
* CSS3
* JavaScript

### Project Structure

.
„¥„Ÿ„Ÿ index.html            // Main HTML file
„¥„Ÿ„Ÿ style.css             // Stylesheet for the new tab page
„¥„Ÿ„Ÿ script.js             // JavaScript for functionality (link management, search, settings)
„¥„Ÿ„Ÿ lang-en.json          // English translations
„¥„Ÿ„Ÿ lang-ja.json          // Japanese translations
„¥„Ÿ„Ÿ lang-zh-Hant.json     // Traditional Chinese translations
„¤„Ÿ„Ÿ README.md             // This README file (English)
„¤„Ÿ„Ÿ README.ja.md          // This README file (Japanese)

### Adding New Languages

To add support for a new language:

1.  Create a new `lang-xx.json` file (e.g., `lang-fr.json` for French) in the project root.
2.  Copy the content from an existing language file (e.g., `lang-en.json`) and translate the values.
3.  Add a new `<option>` to the `language-selector` in `index.html` with the `value` set to your language code (e.g., `fr`) and the display text for the language.
4.  Ensure all new translation keys are present in your new language file.

## Contributing

Contributions are welcome! If you have suggestions for improvements or new features, please open an issue or submit a pull request.

## License

This project is open source and available under the [MIT License](LICENSE).


## Privacy Policy

leiqunni/StartPage (hereinafter referred to as "this project") recognizes the importance of protecting user privacy and handles personal information according to the following policy.

### 1. Information Collected
This project may collect the following information from users:
- Contact information such as name and email address
- Usage history, cookies, IP address, etc.

### 2. Purpose of Use
The collected information will be used for the following purposes:
- Providing and improving services
- Responding to inquiries
- Analyzing usage status

### 3. Provision to Third Parties
Collected information will not be provided to third parties except as required by law.

### 4. Information Management
Collected information will be securely managed to prevent unauthorized access, leakage, or alteration.

### 5. Contact
For requests concerning disclosure, correction, or deletion of personal information, or for questions regarding privacy, please contact:

- Contact Email: leiqunni at gmail dot com

### 6. Revision
This policy may be revised as necessary. Any changes will be announced on this page.

