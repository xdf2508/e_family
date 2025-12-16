// RoomCard组件 - 微信小程序版本
Component({
  properties: {
    room: {
      type: Object,
      value: {}
    }
  },

  data: {
  },

  methods: {
    onBook: function() {
      // 触发预订事件
      this.triggerEvent('book', { room: this.data.room });
    }
  }
});