$(function(){
    // Initialize with model definition
    var TodoModel = Backbone.Model.extend({
        defaults: function() {
            return {
                item: "empty item",
                order: todoMain.nextOrder(),
                done: false
            };
        },
        checkChange: function() {
            this.save({done: !this.get("done")});
        }
    });

    var TodoCollection = Backbone.Collection.extend({
        model: TodoModel,
        localStorage: new Backbone.LocalStorage("todos-backbone"),
        done: function () {
            return this.where({done: true});
        },
        remain: function () {
            return this.without.apply(this, this.done());
        },
        nextOrder: function () {
            if (this.length === 0) return 1;
            return this.last().get("order") + 1;
        },
        comparator: "order"
    })

    var todoMain = new TodoCollection;

    var TodoView = Backbone.View.extend({
        tagName: "li",
        template: _.template($("#item_template").html()),
        events: {
            "click .toggle"      :  "toggleCheck",
            "click a.destroy"    :  "deleteItems",
            "dblclick .View"     :  "editItem",
            "blur .Edit"         :  "updateItem",
            "keypress .Edit"     :  "updateItem_enter"
        },
        initialize: function() {
            this.listenTo(this.model, "change", this.renderAll);
            this.listenTo(this.model, "destroy", this.remove)
        },
        renderAll: function() {
            this.$el.html(this.template(this.model.toJSON()));
            this.$el.toggleClass("done", this.model.get("done"));
            this.input = this.$(".Edit");
            return this;
        },
        toggleCheck: function() {
            this.model.checkChange();
        },
        editItem: function() {
            this.$el.addClass("Editing");
            this.input.focus();
        },
        updateItem: function() {
            var newItem = this.input.val();
            if (newItem.length === 0) {
                this.deleteItems();
            } else {
                this.model.save({item: newItem});
                this.$el.removeClass("Editing");
            }
        },
        updateItem_enter: function(e) {
            if (e.keyCode === 13) {
                this.updateItem();
            }
        },
        deleteItems: function() {
            this.model.destroy();
        }
    });

    var TodoMainView = Backbone.View.extend({
        el: $("#todo_main"),
        footerTemplate: _.template($("#footer_template").html()),
        events: {
            "keypress #todo_inputBox"  :  "addItem_enter",
            "click #todo_checkAll"     :  "checkAllItems",
            "click #RemoveFromView"    :  "removeCheckedItems",
            "click #submitButton"      :  "addItem"
        },

        initialize: function() {
            this.input = this.$("#todo_inputBox");
            this.checkAllBox = this.$("#todo_checkAll")[0];

            this.listenTo(todoMain, "add", this.addOne);
            this.listenTo(todoMain, "reset", this.addAll);
            this.listenTo(todoMain, "all", this.render);

            this.todoSection = $("#todo_section");
            this.footer = this.$("footer");

            todoMain.fetch();
        },

        render: function () {
            var done = todoMain.done().length;
            var numRemain = todoMain.remain().length;
            var numTot = todoMain.length;

            if (numTot === 0) {
                this.todoSection.hide();
                this.footer.hide();
            } else {
                this.todoSection.show();
                this.footer.show();
                this.footer.html(this.footerTemplate({
                    done: done,
                    numRemain: numRemain,
                }))
            }

            this.checkAllBox.checked = !numRemain;
        },

        addOne: function (todo) {
            var view = new TodoView({model: todo});
            this.$("#todo_list").append(view.renderAll().el);
        },

        addAll: function() {
            todoMain.each(this.addOne(), this)
        },

        addItem: function () {
            if (!this.input.val()) return;

            todoMain.create({
                item: this.input.val()
            })
            this.input.val("");
        },

        addItem_enter: function (e) {
            console.log("enter hit")
            if (e.keyCode != 13) return;
            if (!this.input.val()) return;

            todoMain.create({
                item: this.input.val()
            })
            this.input.val("");
        },

        removeCheckedItems: function () {
            _.invoke(todoMain.done(), "destroy");
            return false;
        },

        checkAllItems: function () {
            var done = this.checkAllBox.checked;
            todoMain.each(function (todo) {todo.save({"done": done});});
        }
    });

    var todo = new TodoMainView;

});