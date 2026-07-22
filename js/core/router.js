/**
 * =====================================================
 * SIGVTR
 * Router
 * =====================================================
 */

const Router = {

    routes: {

        home: Home

    },

    init() {

        this.navigate("home");

    },

    navigate(route) {

        const page = this.routes[route];

        if (!page) {

            console.error("Rota inexistente:", route);

            return;

        }

        this.render(page.render());

    },

    render(html) {

        document.getElementById("app").innerHTML = html;

    }

};