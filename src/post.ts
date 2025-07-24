import { PostPage2 } from "./templates.tsx"

const tombstoneJson = [
  {"title":"How the hell do you use the command line","slug":"command_line","description":"And other things you learned ten years ago and forgot how to teach."} ,  
{"title":"I don't really know what \"December Adventure\" is?","slug":"december_adventure_0"} ,
{"title":"Blanksky","slug":"december_adventure_1"} ,
{"title":"About digital gardens","slug":"digital_gardens","description":"Making excuses."} ,
{"title":"Updating to Fabric 1.18 notes","slug":"one_point_eightteen_notes"} ,
{"title":"Reflectively constructing enums at runtime","slug":"enum_reflection","description":"Extending Java enums at runtime. What could go wrong?"} ,
{"title":"Fabric 1.16 Datagens","slug":"fabric_datagens"} ,
{"title":"Fix stuff being broke in IntelliJ","slug":"intellij_fix_it","description":"On fixing old ForgeGradles with new IntelliJs."} ,
{"title":"I am still very tired of my friends being used as political footballs","slug":"football"} ,
{"title":"\"Good enough\" Javascript bundling","slug":"good_enough_bundling","description":"(it's esbuild)"} ,
{"title":"Good title for my puzzle game","slug":"good_title_for_my_puzzle_game"} ,
{"title":"Halfassed response to John Gruber","slug":"great_job_gruber"} ,
{"title":"how 2 angry lex.md","slug":"how_2_angry_lex","description":"Unfinished, short guide to setting up 1.12 coremods"} ,
{"title":"Why can you define Javascript classes with dynamic names?","slug":"js_named_evaluation","description":"Examining a short Javascript snippet."} ,        
{"title":"How to download Java","slug":"managing_java","description":"Every player who visits Oracle's website is a failing on behalf of the community."} ,       
{"title":"A brief, incomplete, and mostly wrong history of modloaders","slug":"mostly_wrong_history_of_modloaders"} ,
{"title":"Neko Atsume is a game where you can pay to miss the point of the game","slug":"nekos","description":"A weak defense of a free-to-play mobile microtransaction game? Can't believe I'm doing this"} ,
{"title":"Obligatory Haha New Website Post","slug":"obligatory_haha_new_website"} ,
{"title":"How to at least *start* updating your mod to 1.21","slug":"one_point_twentyone_compiling"} ,
{"title":"How to play Portal 2 without losing your mind","slug":"playing_portal_2"} ,
{"title":"Registry deep dive","slug":"registry_job_security","description":"Ok how does the registry system work *actually* in 1.20.1"} ,
{"title":"RSS feed is back; misc updates","slug":"rss_is_back"} ,
{"title":"Updating to Fabric 1.17 notes","slug":"one_point_seventeen_notes"} ,
{"title":"Let's look at Stepmania's code","slug":"stepmania_code","description":"A look at the oldest dance game codebase."} ,
{"title":"The Treadmill","slug":"the_treadmill","description":"When that thing you like slowly turns into a live-service game"} ,
{"title":"\"Unable to get Windows mutable environment variable map\"","slug":"unable_to_get_windows_mutable_environment_variable_map","description":"Old gradle, Java 16, $JAVA_HOME, and you"} ,
{"title":"Overview of Resource Reloading in 1.14.4/Fabric","slug":"we_out_here_reloadin","description":"On the new resource reloading system introduced in 1.14"} 
,
{"title":"What the hell is a good build system","slug":"what_the_hell_is_a_build_system","description":"cause it sure as hell isn't Gradle"} ,
{"title":"Where has all the memory gone?","slug":"where_has_all_the_memory_gone","description":"Let's browse a Forge 1.18 modpack heap dump."} ,
{"title":"Who is Bright Data? Into the \"Create: Protection Pixel\" junkware","slug":"who_is_bright_data","description":"(UPDATED Jan 28)"} ,
{"title":"On writing","slug":"writing"} ,
];

export class Post {
  title: string;
  slug: string;
  description: string | undefined;
  
  constructor(frontmatter: {title: string, slug: string, description?: string}) {
    this.title = frontmatter.title;
    this.slug = frontmatter.slug;
    this.description = frontmatter.description;
    return this;
  }
  
  toHtml() {
    return PostPage2({post: this});
  }
}

export const Tombstones: Post[] = tombstoneJson.map(tomb => new Post(tomb));
