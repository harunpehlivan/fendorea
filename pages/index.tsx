// Types
import type { NextPage } from 'next'

// Components
import Head from 'next/head'
import Nav from '../components/nav'
import ImageComponent from '../components/image-component'
import ImageSpotlight from '../components/image-spotlight'
import Bookmarks from '../components/bookmarks'
import PromptMenu from '../components/prompt-menu'
import { Flex, FlexGrow, Button, Input, TextArea, FormLabel } from '../components/ui';

// Hooks 'n stuff
import useStore, { StoreType } from '../scripts/client/store'
import { useEffect, useState } from 'react'

// Other thonkers
import { Get } from '../scripts/fetch'
import { authenticate } from '../scripts/client/actions';
import Swal, { Positive, Negative } from '../scripts/client/modal';

interface singleIdType {
  id: number | string;
}

interface imageInterface {
  comment_count: number;
  created_at: string;
  id: number;
  like_count: number;
  prompt: string;
  url: string;
  user_image: string;
  username: string;
  currentUserLikes: singleIdType[];
  currentUserBookmark: singleIdType[];
}

interface commentInterface {
  id: number;
  created_at: string;
  image_id: number;
  username: string;
  body: string;
  user_image: string;
}

// CSS
import styles from '../styles/index.module.scss';

// Server Side
import supabase, { FindOne } from '../scripts/server/db';

export default function Home({ loggedIn, currentUser:replitUser }) {
  const {
    images,
    imageSpotlightId,
    currentUser,
    setCurrentUser,
    bookmarkMenu,
    promptMenu,
    searchOrder,
    searchQuery,
    setImages,
    spotlightOpen
  } = useStore(s => s);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if(window.location !== window.parent.location){
      Swal.fire({
        allowEnterKey: false,
        allowOutsideClick: false,
        title: "Hold Up there, buddy!",
        text: "Open Fendorea in a new tab for the best experience and functionality.",
        showCancelButton: false,
        showConfirmButton: true,
        confirmButtonText: "Open in Fullscreen",
        preConfirm: async () => {
          window.open("https://fendorea.ironcladdev.repl.co/")
        }
      });
    }
    setCurrentUser(replitUser);
  }, []);

  useEffect(() => {
    document.body.style.overflow = spotlightOpen ? 'hidden' : ""
  }, [spotlightOpen])

  const loadMore = () => {
    if(loggedIn){
      setLoading(true)
      Get(`/api/images?order=${searchOrder}&searchQuery=${searchQuery}&after=${images.length}`)
        .then(data => {
          setImages([...images, ...data])
          setLoading(false)
        })
    }else {
      Swal.fire({
        title: "Log in for more",
        text: "Want to see more images and create your own? Log in first by clicking the button below.",
        showCancelButton: true,
        preConfirm: () => {
          authenticate();
        }
      })
    }
  }
  
  return (
    <div>
      <Nav loggedIn={loggedIn}/>
      
      <div className={styles.imageGrid}>
        {images.map((img:imageInterface) => <ImageComponent key={`image-component-` + img.id} data={img}/>)}
      </div>
      <Flex style={{paddingBottom: '10vh'}}>
        <FlexGrow/>
        <Button onClick={loadMore} style={{justifySelf: 'center'}} disabled={loading}>Load More{loading&&<span className={styles.loader}></span>}</Button>
        <FlexGrow/>
      </Flex>
      
      {imageSpotlightId && <ImageSpotlight id={imageSpotlightId}/>}

      {bookmarkMenu && <Bookmarks/>}

      {promptMenu && <PromptMenu/>}
    </div>
  )
}

export async function getServerSideProps({ req }){
  let admin = await supabase.from("Admins").select("*").eq("username", req.headers['x-replit-user-name']);
  let isBanned = await FindOne("Banned", {
    username: req.headers['x-replit-user-name']
  })
  if(isBanned){
    return {
      redirect: {
        destination: "/banned"
      }
    }
  }else {
    return {
      props: {
        loggedIn: !!req.headers["x-replit-user-name"],
        currentUser: {
          username: req.headers["x-replit-user-name"] || "",
          image: req.headers["x-replit-user-profile-image"] || "",
          id: req.headers["x-replit-user-id"] || "",
          bio: req.headers["x-replit-user-bio"] || "",
          roles: req.headers["x-replit-user-roles"] || "",
          teams: req.headers["x-replit-user-teams"] || "",
          url: req.headers["x-replit-user-url"] || "",
          admin: admin.data.length > 0
        }
      }
    }
  }
}