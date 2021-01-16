/* eslint-disable curly, object-property-newline */
const { Plugin } = require('powercord/entities');
const { React, getModule } = require('powercord/webpack');
const { inject, uninject } = require('powercord/injector');
const { findInReactTree, forceUpdateElement } = require('powercord/util');

const dmTypingStore = require('./stores/dmTypingStore');

const Settings = require('./components/Settings');
const TypingIndicator = require('./components/TypingIndicator');

module.exports = class DMTypingIndicator extends Plugin {
  constructor () {
    super();

    this.classes = {
      tutorialContainer: getModule([ 'homeIcon', 'downloadProgress' ], false).tutorialContainer,
      listItem: getModule([ 'guildSeparator', 'listItem' ], false).listItem
    };
  }

  get dmTypingStore () {
    return dmTypingStore;
  }

  async startPlugin () {
    powercord.api.settings.registerSettings('dm-typing-indicator', {
      category: this.entityID,
      label: 'DM Typing Indicator',
      render: Settings
    });

    this.loadStylesheet('./style.css');
    this.injectTypingIndicator();
  }

  injectTypingIndicator () {
    const { DefaultHomeButton } = getModule([ 'DefaultHomeButton' ], false);
    const ConnectedTypingIndicator = this.settings.connectStore(TypingIndicator);

    inject('dm-typing-indicator', DefaultHomeButton.prototype, 'render', (_, res) => {
      if (!Array.isArray(res)) res = [ res ];

      const badgeContainer = findInReactTree(res, n => n.type?.displayName === 'BlobMask');
      if (badgeContainer && dmTypingStore.getDMTypingUsers().length > 0) {
        badgeContainer.props.lowerBadge = React.createElement(ConnectedTypingIndicator, { badge: true });
        badgeContainer.props.lowerBadgeWidth = 28;
      }

      res.push(React.createElement(ConnectedTypingIndicator, { className: this.classes.listItem }));

      return res;
    });
  }

  pluginWillUnload () {
    uninject('dm-typing-indicator');
    forceUpdateElement(`.${this.classes.tutorialContainer}`);

    powercord.api.settings.unregisterSettings('dm-typing-indicator');
  }
};
