/**
 * =====================================================
 * SIGVTR
 * Página Inicial
 * =====================================================
 */

const Home = {

    render() {

        return `

            ${Card({

                content: `

                    ${Button({
                        text: "RETIRAR VIATURA",
                        icon: "🚓",
                        id: "btnRetirada",
                        variant: "primary",
                        fullWidth: true
                    })}

                    <br><br>

                    ${Button({
                        text: "ADMINISTRAÇÃO",
                        icon: "⚙",
                        id: "btnAdmin",
                        variant: "secondary",
                        fullWidth: true
                    })}

                `

            })}

        `;

    }

};