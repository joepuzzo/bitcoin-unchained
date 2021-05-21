// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default async (req, res) => {
  await new Promise((res) => {
    setTimeout(()=>{
      res();
    }, 2000)
  })
  res.status(200).json({ name: 'John Doe' })
}
