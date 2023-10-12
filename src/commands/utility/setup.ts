import { Command } from "../commands";
import { ChatInputCommandInteraction, Client, Message, EmbedBuilder, CommandInteractionOptionResolver } from "discord.js";



const setup_pages = [
    {
        title: "Step 1: Import the google collab link",
        description: "Reply with the google collab link [google collab](https://colab.research.google.com/github/KoboldAI/KoboldAI-Client/blob/main/colab/TPU.ipynb#scrollTo=ZIL7itnNaw5V)",
        run: async (client: Client, message: Message, args: string[], embeded_message: Message) => {
            let collab_link = args[0];
            
        }
    },
    {
        title: "Step 2: Define your character or use a pre-made character", 
        description: "What is your character's persona ([character(\"Mistress Velvet\")\n{\nSpecies(\"Human\")..])",
        run: async (client: Client, message: Message, args: string[], embeded_message: Message) => {
        }
    }
]

module.exports = {
    name: "setup",
    description: "Setup the mommy bot with your desired character",
    category: "utility",
    usage: "setup",
    aliases: ["config"],
    bot_permisisons: ["SendMessages", "EmbedLinks"],
    owner_only: false,
    enabled: true,
    type: "hybrid",
    interact: async (client: Client, interaction: ChatInputCommandInteraction) => {
        await interaction.reply({ content: "This command is not yet implemented", ephemeral: true });
    },
    run: async (client: Client, message: Message, args: string[]) => {

        // we are going to create a message collector
        // so we can get the user's input

        let current_page = 0;
        let max_page = setup_pages.length;

        const embed = new EmbedBuilder()
            .setAuthor({name: client.user?.username ?? "", iconURL: client.user?.avatarURL() ?? undefined})
            .setTitle(setup_pages[current_page].title)
            .setDescription(setup_pages[current_page].description)
            .setColor(client.config.hex_colors.info)
            .setTimestamp(new Date())
            .setFooter({text: message.author.tag, iconURL: message.author.avatarURL() ?? undefined})

        const embeded_message = await message.reply({ embeds: [embed] });

        const filter = (m: Message) => {
            return m.author.id === message.author.id;
        };

        // use awaitMessages
        message.channel.awaitMessages({filter, max: 1, time: 30000, errors: ["time"]})
            .then(collected => {
                console.log("zebi")
            })
            .catch(collected => {
                console.log("didn't answer in time")
            })

            //if (response?.content.toLowerCase() === "cancel") {
               // return await message.reply("Setup cancelled")
            //}


    }
}