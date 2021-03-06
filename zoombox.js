module.exports = {
  mixins: [require("vue-mixins/getViewportSize"), require("vue-mixins/isOpened"), require("vue-mixins/onWindowResize"), require("vue-mixins/vue"), require("vue-mixins/onWindowScroll"), require("vue-mixins/transition"), require("vue-mixins/style")],
  props: {
    style: {
      "default": function() {
        return [];
      }
    },
    src: {
      type: String,
      required: true
    },
    thumb: {
      type: String
    },
    delay: {
      type: Number,
      "default": 3000
    },
    transition: {
      type: String,
      "default": "zoombox"
    },
    captionTransition: {
      type: String,
      "default": "zoomboxCaption"
    },
    maxScale: {
      type: Number,
      "default": Number.MAX_VALUE
    },
    allowScroll: {
      type: Boolean,
      "default": false
    },
    disableScroll: {
      type: Boolean,
      "default": false
    },
    opacity: {
      type: Number,
      "default": 0.5
    }
  },
  computed: {
    ccTransition: function() {
      var hooks, name;
      name = this.captionTransition;
      hooks = this.Vue.util.resolveAsset(this.$parent.$options, 'transitions', name);
      if (hooks == null) {
        hooks = this.$options.transitions[name];
      }
      if (hooks == null) {
        hooks = {};
      }
      this.$options.transitions[name] = hooks;
      if (this.disableTransition) {
        return null;
      }
      return name;
    },
    thumbSrc: function() {
      if (this.thumb) {
        return this.thumb;
      }
      return this.src;
    },
    cSrc: function() {
      if (!this.thumb || this.shouldLoad) {
        return this.src;
      }
    },
    hasCaption: function() {
      return this._slotContents["default"] != null;
    },
    mergeStyle: function() {
      var style;
      style = {
        display: "inline-block",
        lineHeight: this.loaded && !this.opened ? 0 : null,
        position: "relative",
        cursor: this.opened ? "zoom-out" : "zoom-in"
      };
      if (this.opened || this.closing) {
        style.height = this.thumbSize.height + "px";
        style.width = this.thumbSize.width + "px";
      }
      return style;
    },
    thumbStyle: function() {},
    iStyle: function() {
      if (this.imgScale && this.loaded) {
        if (this.realOpened) {
          return {
            zIndex: this.zIndex,
            transform: "scale(" + (this.scale * this.imgScale) + ")",
            top: this.absPos.top + "px",
            left: this.absPos.left + "px",
            position: "fixed"
          };
        } else if (this.closing) {
          return {
            top: this.relPos.top + "px",
            left: this.relPos.left + "px",
            zIndex: this.zIndex,
            position: "absolute"
          };
        } else {
          return {
            zIndex: this.zIndex,
            position: "absolute"
          };
        }
      }
    },
    captionStyle: function() {
      var style;
      if (!this.loaded) {
        return {
          visibility: "hidden",
          position: "absolute"
        };
      }
      if (this.opened) {
        style = {
          zIndex: this.zIndex,
          top: (this.windowSize.height + this.pos.height * this.scale) / 2 + 6 + 'px',
          left: (this.windowSize.width - this.captionSize.width) / 2 + 'px'
        };
        if (this.opening) {
          style.opacity = 0;
        }
        return style;
      }
    },
    realOpened: function() {
      return this.opened && !this.opening && !this.closing;
    },
    zoom: function() {
      if (this.windowSize) {
        if (this.hasCaption) {
          return 1 - 2 * Math.max(0.05 * this.windowSize.height, this.captionSize.height * 2) / this.windowSize.height;
        } else {
          return 0.9;
        }
      }
      return null;
    },
    scale: function() {
      var scale;
      if (this.zoom) {
        scale = Math.min(this.zoom * this.windowSize.width / this.pos.width, this.zoom * this.windowSize.height / this.pos.height);
        if (scale > this.maxScale) {
          scale = this.maxScale;
        }
        return scale;
      }
      return null;
    },
    absPos: function() {
      var absLeft, absTop;
      if (this.scale) {
        absLeft = (this.windowSize.width - this.pos.width * this.scale) / 2;
        absTop = (this.windowSize.height - this.pos.height * this.scale) / 2;
        return {
          left: absLeft,
          top: absTop
        };
      }
      return {};
    },
    relPos: function() {
      if (this.scale) {
        return {
          left: this.absPos.left - this.pos.left,
          top: this.absPos.top - this.pos.top
        };
      }
      return {};
    }
  },
  data: function() {
    return {
      transitionDefault: "zoombox",
      shouldLoad: false,
      thumbLoaded: false,
      disableTransition: true,
      loaded: false,
      opening: false,
      closing: false,
      pos: null,
      captionSize: null,
      windowSize: null,
      zIndex: null,
      imgScale: 0,
      imgSize: {},
      thumbSize: {}
    };
  },
  watch: {
    "src": function() {
      this.loaded = false;
      this.disableTransition = true;
      if (!this.thumb) {
        return this.thumbLoaded = false;
      }
    },
    "thumb": function() {
      return this.thumbLoaded = false;
    }
  },
  methods: {
    load: function() {
      return this.shouldLoad = true;
    },
    processThumb: function() {
      if (this.thumb) {
        this.thumbSize = {
          height: this.$els.thumb.clientHeight,
          width: this.$els.thumb.clientWidth
        };
        this.thumbLoaded = true;
        return this.$emit("thumb-loaded");
      }
    },
    processScale: function() {
      var scaleH, scaleW;
      if (this.$el.clientHeight > 0) {
        scaleH = this.$el.clientHeight / this.imgSize.height;
      } else {
        scaleH = Number.MAX_VALUE;
      }
      if (this.$el.clientWidth > 0) {
        scaleW = this.$el.clientWidth / this.imgSize.width;
      } else {
        scaleW = Number.MAX_VALUE;
      }
      this.imgScale = Math.min(scaleH, scaleW);
      if (!this.thumb && this.imgScale < Number.MAX_VALUE && this.imgScale > 0) {
        return this.thumbSize = {
          height: this.imgSize.height * this.imgScale,
          width: this.imgSize.width * this.imgScale
        };
      }
    },
    processSrc: function() {
      this.imgSize = {
        height: this.$els.imgsrc.clientHeight,
        width: this.$els.imgsrc.clientWidth
      };
      this.captionSize = {
        height: this.$els.caption.offsetHeight,
        width: this.$els.caption.offsetWidth
      };
      this.processScale();
      if (this.imgScale < Number.MAX_VALUE && this.imgScale > 0) {
        if (!this.thumb) {
          this.thumbLoaded = true;
          this.$emit("thumb-loaded");
        }
        this.loaded = true;
        this.disableTransition = false;
        this.$emit("image-loaded");
        if (this.opened) {
          return this.$nextTick((function(_this) {
            return function() {
              return _this.calc();
            };
          })(this));
        }
      }
    },
    calc: function() {
      this.$set("pos", this.$el.getBoundingClientRect());
      return this.$set("windowSize", this.getViewportSize());
    },
    show: function() {
      var endOpening;
      if (this.opened) {
        return;
      }
      if (!(this.closing || !this.loaded)) {
        this.calc();
      }
      this.setOpened();
      if (this.loaded) {
        this.opening = true;
        endOpening = (function(_this) {
          return function() {
            _this.opening = false;
            _this.$off("after-enter", endOpening);
            return _this.$off("enter-cancelled", endOpening);
          };
        })(this);
        this.$on("after-enter", endOpening);
        return this.$on("enter-cancelled", endOpening);
      }
    },
    hide: function() {
      var endClosing;
      if (!this.opened) {
        return;
      }
      this.closing = true;
      endClosing = (function(_this) {
        return function() {
          _this.closing = false;
          _this.$off("after-leave", endClosing);
          return _this.$off("leave-cancelled", endClosing);
        };
      })(this);
      this.$on("after-leave", endClosing);
      this.$on("leave-cancelled", endClosing);
      return this.setClosed();
    },
    open: function() {
      var close, ref, zIndex;
      if (this.opened) {
        return;
      }
      ref = this.overlay.open({
        allowScroll: !this.disableScroll,
        opacity: this.opacity,
        onBeforeClose: (function(_this) {
          return function() {
            return _this.close();
          };
        })(this)
      }), zIndex = ref.zIndex, close = ref.close;
      this.zIndex = zIndex;
      this.closeOverlay = close;
      if (!this.allowScroll) {
        this.removeScrollListener = this.onWindowScroll(this.close);
      }
      return this.$nextTick(this.show);
    },
    close: function() {
      if (!this.opened) {
        return;
      }
      this.hide();
      if (typeof this.closeOverlay === "function") {
        this.closeOverlay();
      }
      if (typeof this.removeScrollListener === "function") {
        this.removeScrollListener();
      }
      this.zIndex = null;
      return this.closeOverlay = null;
    },
    toggle: function(e) {
      if (e != null) {
        if (e.defaultPrevented) {
          return;
        }
        e.preventDefault();
      }
      if (this.opened) {
        return this.close();
      } else {
        return this.open();
      }
    }
  },
  created: function() {
    return this.available = false;
  },
  mounted: function() {
    this.overlay = require("vue-overlay")(this.Vue);
    if (this.opened) {
      this.available = true;
    }
    this.onWindowResize((function(_this) {
      return function() {
        _this.processScale();
        return _this.calc();
      };
    })(this));
    if (this.delay && this.thumb) {
      return setTimeout(this.load, this.delay);
    }
  },
  beforeDestroy: function() {
    if (typeof this.closeOverlay === "function") {
      this.closeOverlay();
    }
    return typeof this.removeScrollListener === "function" ? this.removeScrollListener() : void 0;
  }
};

if (module.exports.__esModule) module.exports = module.exports.default
;(typeof module.exports === "function"? module.exports.options: module.exports).template = "<div class=zoombox :style=computedStyle @click=toggle><img v-bind:src=cSrc v-if=\"cSrc &amp;&amp; !loaded\" ref=imgsrc @load=processSrc style=position:absolute;visibility:hidden><img class=zoombox-image :style=thumbStyle ref=thumb v-if=\"!thumbLoaded || (!opened &amp;&amp; !opening &amp;&amp; !closing)\" style=\"transform-origin: top left; max-width: 100%; height: auto\" @load=processThumb :src=thumbSrc @mouseenter=load><img class=zoombox-image :style=iStyle style=\"display:inline-block; transform-origin: top left; line-height: 0\" v-if=\"loaded &amp;&amp; opened\" :src=src :transition=cTransition><div class=zoombox-caption ref=caption :style=captionStyle style=\"position: fixed\" v-if=\"opened || !loaded\" :transition=ccTransition><slot></slot></div><div class=zoombox-loading v-if=\"!loaded &amp;&amp; opened\" style=\"position:fixed;left: 50%;top: 50%;transform: translate(-50%, -50%)\"><slot name=loading>loading ...</slot></div></div>"
